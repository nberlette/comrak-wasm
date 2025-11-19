// deno-lint-ignore-file no-import-prefix
import type { ComrakOptions } from "@nick/comrak";
import pkg from "./deno.json" with { type: "json" };

// the old version from deno.land uses an asynchronous instantiation
// function, so we must await it before running benchmarks.
// await comrak_old.init();

const targets = [
  {
    name: "deno.land/x/comrak",
    version: "0.1.1",
    package: () => import("https://deno.land/x/comrak@0.1.1/mod.ts"),
  },
  {
    name: "jsr:@nick/comrak",
    version: pkg.version,
    package: () => import("./mod.ts"),
    baseline: true,
  },
  {
    name: "npm:comrak",
    version: "0.4.2",
    package: () => import("npm:comrak@0.4.2"),
  },
] as const satisfies readonly ComrakTarget[];

interface ComrakBenchmark {
  input: string;
  name?: string;
  n?: number;
  warmup?: number;
  options?: ComrakOptions;
}

interface ComrakTargetPackage {
  markdownToHTML(md: string, options?: Record<string, unknown>): string;
}

interface ComrakTarget {
  name: string;
  version: string;
  package: () => Promise<ComrakTargetPackage>;
  baseline?: boolean;
}

const readme = await Deno.readTextFile("./README.md");

const options = {
  extension: {
    footnotes: true,
    strikethrough: true,
    table: true,
    descriptionLists: true,
    autolink: false,
    superscript: true,
    tasklist: true,
  },
  parse: {
    smart: true,
  },
  render: {
    githubPreLang: true,
    hardbreaks: true,
    escape: true,
    // listStyle: "dash",
    width: 80,
    unsafe: false,
  },
} as const satisfies ComrakOptions;

const basic_md =
  "# comrak\n\nThis is the best Markdown renderer. Ever.\n\n## Features\n\n- [x] Render Markdown to HTML at the speed of light.\n- [x] Supports the full CommonMark specification.\n- [x] Highly configurable and extensible.\n- [x] Written in Rust and compiled to WebAssembly.\n- [x] Super fucking fast!!!\n\n---\n\nLet's try out some **bold** and _italic_ text, shall we?.\n\n> This is a blockquote.  \n> Would you fancy some `inline code`?\n\n```js\n// or maybe a fenced code block?\nconsole.log('Hello, world!');\n```\n\n---\n\n<small data-inline-html>That's all folks!</small>\n";

const benchmarks = [
  {
    name: `Basic Markdown (${basic_md.length} B)`,
    input: basic_md,
  },
  {
    name: `Basic Markdown (${basic_md.length} B): warmup=100`,
    input: basic_md,
    warmup: 100,
  },
  {
    name: `Basic Markdown (${basic_md.length} B): with options`,
    input: basic_md,
    options,
  },
  {
    name: `Basic Markdown (${basic_md.length} B): warmup=100, with options`,
    input: basic_md,
    warmup: 100,
    options,
  },
  {
    name: `Comrak README.md (${readme.length} B)`,
    input: readme,
  },
  {
    name: `Comrak README.md (${readme.length} B): warmup=50`,
    input: readme,
    warmup: 50,
  },
  {
    name: `Comrak README.md (${readme.length} B): with options`,
    input: readme,
    options,
  },
  {
    name: `Comrak README.md (${readme.length} B): warmup x50, with options`,
    input: readme,
    warmup: 50,
    options,
  },
] as ComrakBenchmark[];

const maxLen = Math.max(...targets.map((t) => t.name.length));

for (const { name: group, input, warmup, n, options } of benchmarks) {
  for (const target of targets) {
    const { version, baseline, ...mod } = { baseline: false, ...target };
    const modName = mod.name.padEnd(maxLen + 1);
    const name = `${modName} v${version}${baseline ? " (baseline)" : ""}`;

    Deno.bench({
      name,
      group,
      warmup,
      n,
      baseline,
      async fn() {
        const pkg = await target.package() as (
          [typeof target.package] extends [() => infer U] ? Awaited<U> : never
        );
        if ("init" in pkg && typeof pkg.init === "function") {
          await pkg.init();
        }
        pkg.markdownToHTML(input, options);
      },
    });
  }
}
