#!/usr/bin/env -S deno run -Aq

// File adapted from https://deno.land/x/brotli@v0.1.4/scripts/build.ts
// Copyright 2020-present the denosaurs team. All rights reserved. MIT license.
// Copyright 2025 Nicholas Berlette. All rights reserved. MIT license.

// deno-lint-ignore-file no-import-prefix

import zlib from "node:zlib";

import * as lz4 from "jsr:@nick/lz4@0.3.4";
import { $, type Path } from "jsr:@david/dax@0.44.1";
import { legacy } from "./parse_comrak_version.ts";

type Algorithm = "brotli" | "lz4";

const name = "comrak_wasm";

const OUT_DIR = Deno.env.get("OUT_DIR") || "lib";
const DECOMPRESSOR_FILE = Deno.env.get("DECOMPRESSOR_FILE") ||
  "decompress.bundle.js";

/** Maximum size threshold for automatic brotli compression. */
const MAX_WASM_SIZE = 750 * 1024; // 750KB

/**
 * Controls the quality level of automatic brotli compression.
 * If set to `0`, compression is forcibly disabled.
 */
const WASM_COMPRESS = +(Deno.env.get("WASM_COMPRESS") || "11");

const WASMBUILD_VERSION = Deno.env.get("WASMBUILD_VERSION") || "0.19.1";

async function requires(...executables: string[]) {
  for (const executable of executables) {
    if (!await $.commandExists(executable)) {
      err(`Could not find required build tool ${executable}`);
    }
  }
}

function log(
  text: string,
  color: string | number = 2,
  logger: "log" | "error" | "warn" | "debug" = "log",
): void {
  if (logger === "log") {
    const firstSpace = text.indexOf(" ");
    const first = text.slice(0, firstSpace);
    const rest = text.slice(firstSpace);
    text = `\x1b[92m${first}\x1b[0m${rest}`;
  } else {
    text = `\x1b[${color}m${logger}\x1b[0m ${text}`;
  }
  console[logger](text);
}

function err(text: string): never {
  log(text, "1;31", "error");
  return Deno.exit(1);
}

function compress(
  data: string,
  algorithm: Algorithm = "brotli",
  quality = WASM_COMPRESS,
): string {
  const buf = Uint8Array.fromBase64(data.replace(/\\|\s+/g, ""));

  let output: Uint8Array;
  if (algorithm === "lz4") {
    output = lz4.compress(buf);
  } else {
    output = zlib.brotliCompressSync(buf, {
      params: {
        // we don't use text mode since we're not compressing text
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_GENERIC,
        [zlib.constants.BROTLI_PARAM_QUALITY]: quality,
        [zlib.constants.BROTLI_PARAM_LGWIN]: 22,
      },
    });
  }
  return output.toBase64().replace(/.{77}/g, "$&\\\n");
}

async function get_decompressor(algorithm: Algorithm = "brotli") {
  // fetching from esm.sh since it's easier than bundling it ourselves.
  let text = "";
  const path = $.path(OUT_DIR).join(DECOMPRESSOR_FILE);
  if (algorithm === "lz4") {
    log("downloading jsr:@nick/lz4 wasm decompressor");
    text = await fetch(
      "https://esm.sh/jsr/@nick/lz4/es2022/lib/lz4.bundle.mjs?minify&bundle",
    ).then((r) => r.text());
  } else {
    log("downloading npm:debrotli wasm decompressor");
    // the debrotli package is a ~250KB inline brotli decompressor (WASM).
    // its very fast and has a small footprint.
    text = await fetch(
      "https://esm.sh/debrotli/es2022/lib/brotli.bundle.mjs?minify&bundle",
    ).then((r) => r.text());
  }
  text = $.dedent`
    // deno-lint-ignore-file
    // deno-fmt-ignore-file
    // @ts-nocheck -- generated
    ${text}
  `;
  const size = pretty_bytes(text.length, 2);
  log(`writing ${algorithm} decompressor to "${path}" (${size})`);
  await path.writeText(text);
}

async function rewrite_exports(path: string | Path) {
  path = $.path(path);
  const src = await path.readText();

  // remove internal exports from the public API
  // (theres no reason to expose all of the `__wbg_*` stuff to the user)
  const out = src.replace(
    /^\s*export\s+\*\s+from\s+(["'])(\S+?\.internal\.m?js)\1;?\s*$/gm,
    (_, q, p) => {
      const internal = Deno.readTextFileSync(
        path.toString().replace(/(?<=\/)[^/]+$/, p).replace(/\/\.\//g, "/"),
      );
      const re =
        /export\s+(?:const|function|class)\s+((?!_)[^\s(={]+?)\s*(?:[(={])/g;
      const exports = new Set<string>();
      for (const m of internal.matchAll(re)) exports.add(m[1]);
      return $.dedent`
        export {
          ${[...exports].join(",\n  ")},
        } from ${q}${p}${q};
      `;
    },
  );

  await path.writeText(out);

  log(`optimized exports in \x1b[1;4;92m${path}\x1b[0m\n`);
}

/**
 * Decodes, compresses, and re-encodes the inline wasm module in the js file.
 * This reduces the size of the module by up to 75% (e.g. ~1.2M to ~250K).
 */
async function compress_wasm(
  path: string | Path,
  algorithm: Algorithm = "brotli",
) {
  path = $.path(path);
  const src = await path.readText();

  const out = src.replace(
    /const bytes = base64decode\("(.+?)"\);\s*?\n/s,
    (_, b) => {
      const prelude = $.dedent`
        import { decompress } from "./${DECOMPRESSOR_FILE}";
      `;
      return $.dedent`
        ${prelude}
        const bytes = decompress(
          base64decode("${"\\\n"}${compress(b, algorithm)}${"\\\n"}")
        );
      `;
    },
  );

  await path.writeText(out);

  const srcLen = src.length, outLen = out.length;
  const reduction = ((srcLen - outLen) / srcLen * 100).toFixed(2);
  const srcSize = pretty_bytes(srcLen, 2);
  const outSize = pretty_bytes(outLen, 2);
  log(
    `compressed wasm with ${algorithm} from \x1b[91m${srcSize}\x1b[39m to \x1b[1;4;92m${outSize}\x1b[0m (\x1b[1;93m${reduction}%\x1b[0m savings)`,
  );
}

async function bundle(src: string | Path, dest: string | Path) {
  src = $.path(src).resolve();
  dest = $.path(dest).resolve();

  const src_dts = src.withExtname(".d.ts");
  const dest_dts = dest.withExtname(".d.ts");

  await $`deno bundle -q --minify --platform browser --inline-imports=true --output=${dest} ${src}`;

  await $`cp ${src_dts} ${dest_dts}`;

  let bundled = await dest.readText();
  bundled = $.dedent`
    // deno-coverage-ignore-file
    // deno-coverage-ignore-start
    // deno-lint-ignore-file
    // deno-fmt-ignore-file
    /// <reference types="./${dest_dts.basename()}" />
    ${bundled.trim()}
    // deno-coverage-ignore-stop
  `;
  await dest.writeText(bundled);

  const size = pretty_bytes(+(dest.statSync()?.size ?? 0), 2);
  const path = $.path(Deno.cwd()).relative(dest);
  log(`bundled wasm module to \x1b[1;4;92m${path}\x1b[0m (${size})`);
}

function pretty_bytes(
  size: number | string,
  precision = 2,
  iec = false,
  unitOverride?: string,
): string {
  const units_si = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
  const units_iec = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"] as const;
  size = +size;
  if (isNaN(size) || !isFinite(size)) return "NaN";
  const units = iec ? units_iec : units_si;
  const factor = iec ? 1024 : 1000;
  let i = 0;
  for (i = 0; size >= factor && i < units.length - 1; size /= factor, i++);
  size = (+size.toFixed(precision)).toLocaleString(["en-US"], {
    useGrouping: true,
    maximumFractionDigits: precision,
    style: "decimal",
  });
  return `${size} ${unitOverride ?? units[i]}`;
}

async function build(...args: string[]) {
  await requires("rustup", "rustc", "cargo");

  if (!(await Deno.stat("Cargo.toml")).isFile) {
    err(`the build script should be executed in the "${name}" root`);
  }

  log(`building using @deno/wasmbuild@${WASMBUILD_VERSION}`);

  await $`deno run -Aq --env-file=.env jsr:@deno/wasmbuild@${WASMBUILD_VERSION} --inline --out ${OUT_DIR}`
    .env({
      WASM_OPT_LEVEL: Deno.env.get("WASM_OPT_LEVEL") ?? "z",
      WASM_OPT_BULK_MEMORY: Deno.env.get("WASM_OPT_BULK_MEMORY") ?? "1",
      WASM_OPT_EXTRA_ARGS: Deno.env.get("WASM_OPT_EXTRA_ARGS") ?? "",
    });
  // await run(
  //   `building ${name}...`,
  //   "deno",
  //   "run",
  //   "-Aq",
  //   "--env-file=.env",
  //   `jsr:@deno/wasmbuild@${WASMBUILD_VERSION}`,
  //   "--inline",
  //   "--out",
  //   OUT_DIR,
  // );

  const generated = await Array.fromAsync(
    Deno.readDir(OUT_DIR),
    ({ name }) => `${OUT_DIR}/${name}`,
  );

  const [maybePath] = args;
  const path = maybePath ||
    generated.find((p) => /(?<!\.internal)\.m?js$/.test(p));
  const stat = path ? await Deno.stat(path).catch(() => null) : null;

  if (!path || !stat) {
    err(
      `could not find file "${path}" in "${OUT_DIR}".\n\n` +
        `Available files:\n\n - ${generated.join("\n - ")}\n`,
    );
  }

  await rewrite_exports(path);

  let shouldCompress = legacy || stat.size > MAX_WASM_SIZE;
  if (WASM_COMPRESS === 0) shouldCompress = false;
  if (Deno.env.get("WASM_COMPRESS_FORCE") === "1") shouldCompress = true;

  if (shouldCompress) {
    let algorithm: Algorithm = "brotli";
    if (Deno.env.get("WASM_DECOMPRESSOR")?.trim().toLowerCase() === "lz4") {
      algorithm = "lz4";
    }
    await compress_wasm(path, algorithm);
    await get_decompressor(algorithm);
  } else {
    const size = pretty_bytes(stat.size, 2);
    log(`✔︎ wrote \x1b[1;4;92m${path}\x1b[0;2m (${size} uncompressed)\x1b[0m\n`);
  }

  const src = $.path(path).resolve();
  const out = await src.parentOrThrow().resolve("../src/lib").ensureDir();
  const dest = out.join(src.basename());

  await bundle(src, dest);
}

if (import.meta.main) await build(...Deno.args);
