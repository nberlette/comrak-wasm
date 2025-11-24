#!/usr/bin/env -S deno run -q --allow-read=./Cargo.toml --allow-read=./lib

// deno-lint-ignore-file no-import-prefix
// deno-coverage-ignore-file
// deno-coverage-ignore-start
import { parse as parseVersion } from "jsr:@std/semver@1.0.7/parse";
import type { SemVer } from "jsr:@std/semver@1.0.7/types";
import process from "node:process";

const wasm = await import(
  // prevent static analysis in case the file doesn't exist yet
  "../lib/comrak_wasm.js" + ""
).catch(() => ({} as never));

/**
 * Helper function for determining the version of comrak used in this build,
 * allowing us to adjust our expected test outputs accordingly to account for
 * breaking changes that have happened between different minor versions of the
 * comrak library.
 *
 * @param path Optional Cargo.toml file path to parse the version from.
 * @param [fallback] The fallback version to use if the version cannot be
 *                   determined. If set to `null` or `undefined`, an error will
 *                   be thrown when a version is unable to be determined.
 *                   Defaults to `"0.0.0"`.
 * @returns The parsed SemVer object representing the comrak version.
 * @internal
 */
export function parseComrakVersion(
  path?: string,
  fallback: string | SemVer | null | undefined = "0.0.0",
): SemVer {
  // newer versions of this project will expose a version function
  if ("version" in wasm && typeof wasm.version === "function") {
    return parseVersion(wasm.version());
  }

  // but if the version() bindings are unavailable, we'll fallback to parsing
  // the project's Cargo.toml file to extract the dependency version directly
  const toml = Deno.readTextFileSync(path || "./Cargo.toml");
  const version = toml.match(
    /(?<=comrak\s*=\s*(?:\{[^}]*?\bversion\s*=\s*)?)"(.*?)"/,
  )?.[1];

  if (!version) {
    if (fallback == null) {
      throw new ReferenceError("Could not find comrak version");
    } else if (typeof fallback === "string") {
      return parseVersion(fallback);
    } else {
      return fallback;
    }
  }

  return parseVersion(version.replace(/^=/, ""));
}

/**
 * Indicates whether this is a "legacy" build of comrak-wasm, meaning it relies
 * on a version of comrak older than 0.20.0 (at the time of writing the latest
 * release is 0.48.0).
 *
 * @internal
 */
export const legacy = parseComrakVersion().minor < 20;

// allow this to be run as a script too
if (import.meta.main) {
  const v = parseComrakVersion();
  let str = "";
  str += v.major + "." + v.minor + "." + v.patch;
  if (v.prerelease?.length) {
    str += "-" + v.prerelease.join(".");
  }
  if (v.build?.length) {
    str += "+" + v.build.join(".");
  }
  str += "\n";
  process.stdout.write(str);
  process.exit(0);
}

// deno-coverage-ignore-stop
