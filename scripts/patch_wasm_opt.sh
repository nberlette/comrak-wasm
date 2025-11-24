#!/usr/bin/env bash

# --------------------------------------------------------------------------- #
# patch_wasm_opt.sh                                                           #
# --------------------------------------------------------------------------- #
# Overview                                                                    #
# --------------------------------------------------------------------------- #
# This script adds support for custom optimization levels and extra command   #
# line arguments for the wasm-opt tool used by the @deno/wasmbuild package.   #
#                                                                             #
# Since the aforementioned utility uses a rather opinionated approach to its  #
# wasm-opt integration, we're boxed out of specifying custom opt levels or    #
# extra arguments for the wasm-opt binary (which downloads and invokes after  #
# building the WebAssembly module and running wasm-bindgen).                  #
# --------------------------------------------------------------------------- #
# How it works                                                                #
# --------------------------------------------------------------------------- #
# 1. Attempt to the original wasm-opt binary. The path pattern is roughly:    #
#    ~/.cache/wasmbuild/version_[0-9]+/binaryen-version_[0-9]+/bin/wasm-opt   #
# 2. If the original wasm-opt binary is found, we rename it to wasm-opt.sh    #
# 3. We copy the ./wasm_opt.sh script adjacent to this file, writing it to    #
#    the original wasm-opt binary path, then ensure it is executable.         #
# 4. Now the @deno/wasmbuild tool will invoke our wrapper, which respects and #
#    inject custom optimization levels and extra args to the wasm-opt binary. #
#                                                                             #
# - See the wasm_opt.sh file adjacent to this script for more details.        #
# - See the section below for a list of supported environment variables that  #
#   can be used to control the behavior of the wasm-opt wrapper script.       #
# --------------------------------------------------------------------------- #
# Environment Variables                                                       #
# --------------------------------------------------------------------------- #
# - WASM_OPT_LEVEL: Controls the --opt-level flag (default: 4)                #
# - WASM_OPT_BULK_MEMORY: Enables bulk memory operations (default: 1)         #
# - WASM_OPT_DEBUG: Enables debug information (default: 0)                    #
# - WASM_OPT_BINARY: Path to the wasm-opt binary (default: auto-detected)     #
# - WASM_OPT_EXTRA_ARGS: Additional arguments to pass to the wasm-opt binary  #
#                                                                             #
# IMPORTANT: these variables MUST be available to the subprocess spawned by   #
# @deno/wasmbuild, which may not inherit the parent process's environment.    #
# To ensure they are inherited and respected as intended, I recommend using a #
# .env file combined with Deno's --env-file flag, like so:                    #
#                                                                             #
# deno run --allow-env --env-file=.env jsr:@deno/wasmbuild@0.19.2             #
# --------------------------------------------------------------------------- #
# License                                                                     #
# --------------------------------------------------------------------------- #
# MIT License. Copyright (c) 2025+ Nicholas Berlette. All rights reserved.    #
# See https://nick.mit-license.org for a copy of the complete license text.   #
# --------------------------------------------------------------------------- #

set -euo pipefail

# Minimum size of the wasm-opt binary to consider it valid. This is passed to
# the `find` command when searching for the binary, to avoid picking up files
# that are too small to be the actual binary (specifically, our wrapper). It
# must follow the syntax understood by `find`, e.g. "8M" (the default).
declare -r MIN_WASM_OPT_SIZE="${MIN_WASM_OPT_SIZE:-"8M"}"
declare FORCE_OVERWRITE="${FORCE_OVERWRITE:-"0"}"

# Finds the wasm-opt binary in a given root directory.
#
# Arguments
# ---------
#
# [root_dir] root directory to search in.
#
# Controls the root directory that `find` searches in. This should usually be
# left as the default of "$HOME/.cache/wasmbuild".
#
# [...names] filenames to search for.
#
# You can also pass custom filename patterns after the root directory, which
# will be formatted and concatenated as a union of `-name` expressions for the
# `find` command. The default candidate names are "wasm-opt" and "wasm-opt.sh".
function find_wasm_opt_binary() {
  local -r root="${1:-"$HOME/.cache/wasmbuild"}"
  local -a names=("wasm-opt" "wasm-opt.sh")

  if (( $# > 1 )) && [[ "$1" == "$root" ]]; then
    shift
    names=("$@")
  fi

  local -a names_expr=()
  for idx in "${!names[@]}"; do
    if (( idx > 0 )); then
      names_expr+=("-o")
    fi
    names_expr+=("-name" "${names[idx]}")
  done
  if (( ${#names[@]} > 1 )); then
    # wrap in parens to group as a single find expr
    names_expr=("(" "${names_expr[@]}" ")")
  fi

  find "$root" \
    -type f -executable "${names_expr[@]}" \
    -size "+${MIN_WASM_OPT_SIZE:-8M}" \
    -print -quit 2>/dev/null | head -n 1
}

# 1. locate the original wasm-opt binary
WASM_OPT_BINARY="${WASM_OPT_BINARY:-"$(find_wasm_opt_binary)"}"
WASM_OPT_WRAPPER="${WASM_OPT_BINARY%.sh}"
WASM_OPT_ORIGINAL="${WASM_OPT_WRAPPER}.sh"

declare -i REPLY_TIMEOUT=${REPLY_TIMEOUT:-10}
declare -i FORCE_OVERWRITE=${FORCE_OVERWRITE:-0}

if [[ "$*" == *"--force"* ]] || [[ "$*" == *"-f"* ]]; then
  FORCE_OVERWRITE=1
fi

# 2. if not found, error out immediately
if [[ -z "$WASM_OPT_BINARY" || ! -x "$WASM_OPT_BINARY" ]]; then
  echo $'\e[31merror\e[0m could not locate the wasm-opt binary' >&2
  exit 1
fi

# 3. patch the binary. we know that the found file is executable and is
#    sufficiently large to (most likely) be the real binary, so we just
#    assume everything is as it should be and proceed.
echo -e $'\e[3;92mPatching\e[0m the \e[35mwasm-opt\e[0m binary:\e[0m\n  '"${WASM_OPT_BINARY}"$'\n'

if [[ -f "${WASM_OPT_ORIGINAL}" ]]; then
  # if the binary already ends with .sh, we assume it's already patched.
  # so we remove that .sh suffix, issue a warning, and either prompt the user
  # to overwrite the existing wrapper, or skip the patching process (if in a
  # non-interactive terminal and not instructed to force overwrite).
  echo -e $'\e[33mwarning!\e[0m the \e[95mwasm-opt\e[0m binary already appears to be patched.' >&2
  echo -e $'   \e[2;3;4moriginal:\e[0m '"${WASM_OPT_BINARY}"$' \e[2m('"$(wc -c < "${WASM_OPT_BINARY}" | xargs)"$' B)\e[0m' >&2,
  echo -e $'   \e[2;3;4mwrapper:\e[0m  '"${WASM_OPT_WRAPPER}"$' \e[2m('"$(wc -c < "${WASM_OPT_WRAPPER}" | xargs)"$' B)\e[0m' >&2
  echo ""
  # if we're in an interactive terminal, prompt the user to overwrite
  if [[ "${FORCE_OVERWRITE:-}" == "1" ]]; then
    echo $'\e[3;93mForcing overwrite of existing wrapper...\e[0m' >&2
  elif [[ -t 0 ]]; then
    declare -ir start_time=$(date +%s)
    declare -ir end_time=$((start_time + REPLY_TIMEOUT))

    # we can't use `read -t` here because we do not want to abruptly exit
    # if the timeout is reached. instead, we want to print a message and
    # exit gracefully. so we use a loop to check the time remaining.

    while true; do
      declare -ir now=$(date +%s)
      if (( now >= end_time )); then
        REPLY=""
        echo ""
        echo -e $'\n\e[1;31mtimeout\e[0m: no response received after '"${REPLY_TIMEOUT:-10}"$' seconds. \e[3;91mAborting.\e[0m' >&2
        exit 142
      fi
      if read -t $((end_time - now)) -n 1 -s -p $'Overwrite existing wrapper? \e[2m[\e[0;92my\e[39;2m/\e[0;1;4;91mN\e[0;2m]\e[0m ' REPLY; then
        echo ""
        break
      else
        res=$?
        echo ""
        echo -e $'\n\e[1;31mtimeout\e[0m: no response received after '"${REPLY_TIMEOUT:-10}"$' seconds. \e[3;91mAborting.\e[0m' >&2
        exit $res
      fi
    done
    REPLY="${REPLY:-N}"

    case "${REPLY^^}" in
      (Y) echo $'\n\e[3;93mOverwriting existing wrapper...\e[0m' >&2 ;;
      (N) echo $'\n\e[3;91mAborting patch process.\e[0m' >&2 ; exit 1 ;;
      (*) echo $'\n\e[31mInvalid response.\e[0;3mAborting patch process.\e[0m' >&2 ; exit 3 ;;
    esac
  elif [[ "$FORCE_OVERWRITE" != "1" ]] && [[ -f "${WASM_OPT_WRAPPER}" ]]; then
    if cmp -s "$(dirname "$0")/wasm_opt.sh" "${WASM_OPT_WRAPPER}"; then
      echo $'\n\e[92munchanged\e[0m: the existing wrapper is up to date.\e[0m \e[1;3mNo action taken.\e[0m'
      exit 0
    fi
  else
    echo -e $'\n\e[1;3mBypassing patch process.\e[0m' >&2
    exit 0
  fi
fi

function hyperlink() {
	local -r url="$1"
	local -r text="${2:-"$1"}"
	local -r id="${3:-"${url//[^a-zA-Z0-9]/}"}"
	# OSC 8 ; params ; URI ST <text> OSC 8 ;; ST
	printf '\e]8;id=%s;%s\a%s\e]8;;\a' "$id" "$url" "$text"
}


if ! [[ -f "${WASM_OPT_ORIGINAL}" ]] || [[ "${WASM_OPT_BINARY}" != "${WASM_OPT_ORIGINAL}" ]]; then
  command mv "${WASM_OPT_BINARY}" "${WASM_OPT_ORIGINAL}" 2>&1
fi

if command cp "$(dirname "$0")/wasm_opt.sh" "${WASM_OPT_WRAPPER}" 2>&1 && \
   command chmod +x "${WASM_OPT_WRAPPER}" 2>&1
then
  echo $'\n\e[1;92mSuccess!\e[39m the \e[95mwasm-opt\e[0m binary can now be configured via environment variables.\n' >&2
  echo $'\e[1;4;34mENVIRONMENT VARIABLES\e[0m\n' >&2
  echo $'  \e[93mWASM_OPT_LEVEL\e[0;2m ······· \e[0mControls the \e[96m--opt-level\e[0m flag (default: \e[1;92m4\e[0m)' >&2
  echo $'  \e[93mWASM_OPT_BULK_MEMORY\e[0;2m · \e[0mEnables bulk memory operations (default: \e[1;92m1\e[0m)' >&2
  echo $'  \e[93mWASM_OPT_DEBUG\e[0;2m ······· \e[0mEnables debug information (default: \e[1;92m0\e[0m)' >&2
  echo $'  \e[93mWASM_OPT_EXTRA_ARGS\e[0;2m ·· \e[0mAdditional arguments to pass to the \e[35mwasm-opt\e[0m binary' >&2
  echo $'\n\e[1;33mIMPORTANT:\e[0m these \e[1;3mmust\e[0m be available to '"$(hyperlink "https://jsr.io/@deno/wasmbuild/doc" $'\e[92m@deno/wasmbuild\e[0m')"\
			 $'at runtime\nor they will be ignored. It\'s recommended to use a '"$(hyperlink "https://dotenv.org" $'\e[33m.env\e[m' "dotenv")"\
			 $'file with\nthe \e[96m--env-file\e[0m flag to ensure they are inherited correctly, like so:\n\n'\
       $'  \e[32mdeno run -A --env-file=.env jsr:@deno/wasmbuild@0.19.2\e[0m\n' >&2
  exit 0
else
  echo $'\e[31merror\e[0m: failed to rename and wrap the \e[95mwasm-opt\e[0m binary.' >&2
  # attempt to revert any partial changes
  command rm -f "${WASM_OPT_WRAPPER}" &>/dev/null
  if [[ "${WASM_OPT_BINARY}" != "${WASM_OPT_ORIGINAL}" ]] && [[ -f "${WASM_OPT_ORIGINAL}" ]]; then
    command mv "${WASM_OPT_ORIGINAL}" "${WASM_OPT_BINARY}" &>/dev/null
  elif [[ -f "${WASM_OPT_ORIGINAL}" ]]; then
    command mv "${WASM_OPT_ORIGINAL}" "${WASM_OPT_WRAPPER}" &>/dev/null
  fi
  echo $'\e[32mrestored\e[0m original \e[95mwasm-opt\e[0m binary' >&2
  exit 2
fi
