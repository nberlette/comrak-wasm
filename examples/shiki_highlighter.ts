#!/usr/bin/env -S deno run -Aq

// deno-lint-ignore-file no-import-prefix
import * as comrak from "@nick/comrak";
import * as shiki from "npm:shiki@3.15.0";
import process from "node:process";

const markdown = `# Shiki + Comrak

This is a simple example of using [shiki](https://shiki.style) as a syntax
highlighter with [comrak](https://github.com/nberlette/comrak-wasm).

## Install

\`\`\`sh
deno add jsr:@nick/comrak npm:shiki
\`\`\`

## Example

\`\`\`\`ts
import * as comrak from "@nick/comrak";
import * as shiki from "shiki";

const sh = await shiki.createHighlighter({
  themes: ["nord", "github-light", "github-dark"],
  langs: ["typescript", "javascript", "rust", "bash"],
});

const md = \`# Hello, world! (so meta)

\\\`\\\`\\\`sh
deno add jsr:@nick/comrak npm:shiki
\\\`\\\`\\\`

\\\`\\\`\\\`ts
import * as comrak from "@nick/comrak";
import * as shiki from "shiki";
\\\`\\\`\\\`

---

Fin!
\`;

const html = comrak.markdownToHTML(md, {
  extension: { table: true, tasklist: true, autolink: true },
  plugins: {
    render: {
      codefenceSyntaxHighlighter: {
        highlight: (code, lang) => sh.codeToHtml(code, {
            lang: lang ?? "ts",
            theme: "nord",
          }).match(/^(.+?)<\\/code>/s)?.[1] ?? \`<pre><code>\${code}\`,
        pre: () => "",
        code: () => "",
      },
    },
  },
});

console.log(html);
\`\`\`\`
`;

// shiki highlighter setup (async)
const sh = await shiki.createHighlighter({
  themes: ["nord", "github-light", "github-dark", "dracula"],
  langs: ["typescript", "javascript", "rust", "bash"],
});

// try to read input from stdin
let text = "";
for await (const chunk of process.stdin) {
  text += chunk;
}

// falling back to our default markdown if no stdin input
if (!text.trim()) text = markdown;

// render markdown to HTML with shiki highlighting (synchronous)
const html = comrak.markdownToHTML(text, {
  extension: {
    table: true,
    tasklist: true,
    autolink: true,
    headerIDs: "",
  },
  render: {
    hardbreaks: true,
    unsafe: true,
    ignoreEmptyLinks: true,
    fullInfoString: true,
  },
  plugins: {
    render: {
      codefenceSyntaxHighlighter: {
        highlight: (code, lang) =>
          sh.codeToHtml(code, {
            lang: lang ?? "ts",
            theme: "nord",
          })
            // hacky way to inherit shiki's styled pre/code tags
            .match(/^(.+?)<\/code>/s)?.[1] ?? `<pre><code>${code}`,
        // prevent comrak from adding opening pre/code tags
        pre: () => "",
        code: () => "",
      },
    },
  },
});

// output the resulting HTML to stdout
console.log(html);
