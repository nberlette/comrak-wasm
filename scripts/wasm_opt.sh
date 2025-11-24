#!/usr/bin/env bash

set -euo pipefail

# --------------------------------------------------------------------------- #
# wasm_opt.sh                                                                 #
# --------------------------------------------------------------------------- #
# This file is a wrapper around the wasm-opt binary to simplify the process   #
# of optimizing WebAssembly binaries and improve the functionality of the     #
# @deno/wasmbuild utility.                                                    #
#                                                                             #
# Its original use case is injection of the --enable-bulk-memory-opt flag,    #
# and enabling custom opt-levels, neither of which are supported by default   #
# in @deno/wasmbuild.                                                         #
# --------------------------------------------------------------------------- #
# Usage                                                                       #
# --------------------------------------------------------------------------- #
# This script is intended to be patched into place of the original binary,    #
# typically located in the Deno cache dir. You can do this manually, however  #
# it's recommended to use the accompanying `patch_wasm_opt.sh` tool instead.  #
#                                                                             #
# Once patched, you configure the custom settings and args via environment    #
# variables, and then call `wasm-opt` as you normally would. The script will  #
# intercept the call, inject the necessary flags, and then delegate to the    #
# original wasm-opt binary.                                                   #
# --------------------------------------------------------------------------- #
# Environment Variables                                                       #
# --------------------------------------------------------------------------- #
# - WASM_OPT_LEVEL: Controls the --opt-level flag (default: 4)                #
# - WASM_OPT_BULK_MEMORY: Enables bulk memory operations (default: 0)         #
# - WASM_OPT_DEBUG: Enables debug information (default: 0)                    #
# - WASM_OPT_BINARY: Path to the wasm-opt binary (default: auto-detected)     #
# - WASM_OPT_EXTRA_ARGS: Additional arguments to pass to the wasm-opt binary  #
# --------------------------------------------------------------------------- #
# MIT License. Copyright (c) 2025+ Nicholas Berlette. All rights reserved.    #
# See https://nick.mit-license.org for a copy of the complete license text.   #
# --------------------------------------------------------------------------- #

if [ -r "$PWD/.env" ]; then
  source "$PWD/.env"
fi

# 1. configure and set up the environment
readonly WASM_OPT_LEVEL="${WASM_OPT_LEVEL:-"${OPT_LEVEL:-"4"}"}"
readonly WASM_OPT_BULK_MEMORY="${WASM_OPT_BULK_MEMORY:-""}"
readonly WASM_OPT_DEBUG="${WASM_OPT_DEBUG:-""}"
readonly WASM_OPT_EXTRA_ARGS="${WASM_OPT_EXTRA_ARGS:-""}"
readonly WASM_OPT_BINARY="${WASM_OPT_BINARY:-"$(realpath "$0" | sed 's/\.sh$//').sh"}"

# 2. prepare the base args array
declare -a args=("-O${WASM_OPT_LEVEL}")

[[ -n "$WASM_OPT_BULK_MEMORY" ]] && args+=("--enable-bulk-memory-opt")
[[ -n "$WASM_OPT_DEBUG" ]] && args+=("--debug")

# 3. collect and process the incoming arguments
#    - remove the -O / --opt-level flag
#    - remove any other conflicting flags
#    - pass through all other flags
#    - preserve the order of the arguments as much as possible
#    - respect user-specified flags via the environment variables above
for arg in "$@"; do
  case "$arg" in
    (-O[0-4sz]) ;; # skip the optimization level flag
    (--opt-level=*) ;; # skip the optimization level flag
    # if specified as two separate args, skip the next arg as well
    (--opt-level) shift ;;
    # in case deno/wasmbuild adds support for custom flags in the future,
    # we respect the following flags, unless they've been explicitly set
    # by the user via the environment variables above.
    (--[a-z]-bulk-memory-opt)
      [[ -z "$WASM_OPT_BULK_MEMORY" ]] && args+=("$arg") ;;
    (--*debug) [[ -z "$WASM_OPT_DEBUG" ]] && args+=("$arg") ;;
    # pass through all other args
    (*) args+=("$arg") ;;
  esac
done

# 4. append any extra args specified via the environment variable
#    - we must be careful to inject these at the end, but BEFORE the input
#      and output files, which are always the last two arguments.
declare -i idx=0
if [[ -n "$WASM_OPT_EXTRA_ARGS" ]]; then
  # split the extra args string into an array, respecting quoted substrings
  # (this is a bit hacky, but works for our use case)
  read -r -a extra_args <<< "$WASM_OPT_EXTRA_ARGS"

  # find the position to insert the extra args
	# we want to insert before the input and output files, which are usually the
	# last two args, unless `-o` is used, in which case the output file is given
	# immediately after `-o` and the input file is the last arg. in that case, we
	# want to insert the args before the `-o` flag.
	for ((i = 0; i < ${#args[@]}; i++)); do
		if [[ "${args[i]}" == "-o" ]] || (( i >= ${#args[@]} - 2 )); then
			idx=$i
			break
		fi
	done

  # insert the extra args at the calculated position
  args=("${args[@]:0:idx}" "${extra_args[@]}" "${args[@]:idx}")
fi

# 5. clean up any duplicate args, preserving order.
#    - allow last two args to be the same, for inline optimizations
declare -A seen=()
declare -a cleaned_args=()

# 5a. iterate over the args and build the cleaned_args array
for ((i = 0; i < ${#args[@]}; i++)); do
  arg="${args[i]}"
  if (( i >= idx )); then
    cleaned_args+=("$arg")
  elif [[ -z "${seen[$arg]:-}" ]]; then
    seen[$arg]=1
    cleaned_args+=("$arg")
  fi
done
args=("${cleaned_args[@]}")

# 5b. if we removed too many args, re-add the last two original args
# Save the last two original arguments before deduplication
orig_last_arg1="${args[idx]}"
orig_last_arg2="${args[idx+1]}"
if (( ${#args[@]} < idx + 2 )); then
  args+=("$orig_last_arg1" "$orig_last_arg2")
fi

# 5c. final sanity check
if (( ${#args[@]} < 2 )); then
  echo "Error: Not enough arguments to wasm-opt after processing." >&2
  exit 1
fi

# 6. execute the real wasm-opt binary with the constructed args
echo $'\e[2;34m> '"${WASM_OPT_BINARY}" $'\e[22m'"${args[@]}"$'\e[0m\n' >&2

exec "${WASM_OPT_BINARY}" "${args[@]}"
