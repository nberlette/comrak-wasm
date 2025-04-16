import * as comrak_old from "https://deno.land/x/comrak@0.1.1/mod.ts";
import * as comrak_npm from "npm:comrak@0.4.2";
import * as comrak from "./mod.ts";
import pkg from "./deno.json" with { type: "json" };

await comrak_old.init();

interface ComrakBenchmark {
  input: string;
  name?: string;
  n?: number;
  warmup?: number;
  options?: comrak.Options;
}

interface ComrakTarget {
  name: string;
  mod: typeof comrak | typeof comrak_npm | typeof comrak_old;
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
} satisfies comrak.Options;

const targets = [
  { name: `${pkg.name} (${pkg.version})`, mod: comrak, baseline: true },
  { name: `comrak (npm)`, mod: comrak_npm },
  { name: `comrak (deno.land, old)`, mod: comrak_old },
] as ComrakTarget[];

const benchmarks = [
  {
    name: "Basic Markdown",
    input: "# Hello World\n\nThis is a test.\n\n- Item 1\n- Item 2",
    warmup: 100,
    // n: 1000,
  },
  {
    name: "Comrak README.md (no warmup, no options)",
    input: readme,
    // warmup: 50,
    // n: 100,
  },
  {
    name: "Comrak README.md (no warmup, with options)",
    input: readme,
    options,
  },
  {
    name: "Comrak README.md (warmup x50, with options)",
    input: readme,
    warmup: 50,
    options,
  },
] as ComrakBenchmark[];

for (const { name: group, input, warmup, n, options } of benchmarks) {
  for (const { name, mod, baseline } of targets) {
    Deno.bench({
      name,
      group,
      warmup,
      n,
      baseline,
      fn: () => {
        mod.markdownToHTML(input, options);
      },
    });
  }
}
