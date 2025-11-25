# [`@nick/comrak`]

<big>High-performance Markdown to HTML converter powered by WebAssembly.</big>

---

## Overview

`@nick/comrak` is a fast and efficient Markdown to HTML converter written in
Rust, compiled to WebAssembly, and wrapped with a high-level TypeScript API. It
renders HTML, CommonMark, and CommonMark XML, and mirrors the configurability of
the upstream `comrak` crate.

## Usage

Convert Markdown to HTML with a single function call:

```ts
import assert from "node:assert";
import { markdownToHTML } from "@nick/comrak";

const markdown = "# Hello, **world**!";
const html = markdownToHTML(markdown);

assert.strictEqual(html, "<h1>Hello, <strong>world</strong>!</h1>\n");
```

Render any format you need:

```ts
import assert from "node:assert";
import {
  markdownToCommonMark,
  markdownToHTML,
  markdownToXML,
} from "@nick/comrak";

const md = "# Hello, **world**!";

assert.strictEqual(
  markdownToHTML(md),
  "<h1>Hello, <strong>world</strong>!</h1>\n",
);
assert.strictEqual(
  markdownToXML(md),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE document SYSTEM "CommonMark.dtd">\n' +
    '<document xmlns="http://commonmark.org/xml/1.0">\n' +
    '  <heading level="1">\n' +
    '    <text xml:space="preserve">Hello, </text>\n' +
    "    <strong>\n" +
    '      <text xml:space="preserve">world</text>\n' +
    "    </strong>\n" +
    '    <text xml:space="preserve">!</text>\n' +
    "  </heading>\n" +
    "</document>\n",
);
assert.strictEqual(markdownToCommonMark(md), "# Hello, **world**\\!\n");
```

Parse once and render anywhere:

```ts
import assert from "node:assert";
import {
  type Options,
  parseMarkdown,
  renderCommonMark,
  renderHTML,
  renderXML,
} from "@nick/comrak";

const options = { extension: { tasklist: true } } satisfies Options;
const ast = parseMarkdown("# Hello, **world**!\n\n- [x] Done\n", options);

assert.strictEqual(
  renderHTML(ast, options),
  "<h1>Hello, <strong>world</strong>!</h1>\n" +
    '<ul>\n<li><input type="checkbox" checked="" disabled="" /> Done</li>\n</ul>\n',
);
assert.strictEqual(
  renderXML(ast, options),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE document SYSTEM "CommonMark.dtd">\n' +
    '<document xmlns="http://commonmark.org/xml/1.0">\n' +
    '  <heading level="1">\n' +
    '    <text xml:space="preserve">Hello, </text>\n' +
    "    <strong>\n" +
    '      <text xml:space="preserve">world</text>\n' +
    "    </strong>\n" +
    '    <text xml:space="preserve">!</text>\n' +
    "  </heading>\n" +
    '  <list type="bullet" tasklist="true" tight="true">\n' +
    '    <taskitem completed="true">\n' +
    "      <paragraph>\n" +
    '        <text xml:space="preserve">Done</text>\n' +
    "      </paragraph>\n" +
    "    </taskitem>\n" +
    "  </list>\n" +
    "</document>\n",
);
assert.strictEqual(
  renderCommonMark(ast, options),
  "# Hello, **world**\\!\n\n- [x] Done\n",
);
```

Add plugins for custom rendering:

````ts
import assert from "node:assert";
import { markdownToHTML, Options } from "@nick/comrak";

const options = Options.default();
options.plugins.render.codefenceSyntaxHighlighter = {
  highlight: (code, lang) => `highlighted:${lang ?? "none"}:${code.trim()}`,
  pre: () => '<pre class="custom-pre">',
  code: () => '<code class="custom-code">',
};

const html = markdownToHTML("```ts\nlet x = 1;\n```\n", options);
assert.strictEqual(
  html,
  '<pre class="custom-pre"><code class="custom-code">highlighted:ts:let x = 1;</code></pre>\n',
);
````

```ts
import assert from "node:assert";
import { markdownToHTML, Options } from "@nick/comrak";

const options = Options.default();
options.render.sourcepos = true;
options.plugins.render.headingAdapter = {
  enter: ({ level, content }, sourcepos) => {
    const attrs = [`data-level="${level}"`, `data-text="${content}"`];
    if (sourcepos) {
      const { start, end } = sourcepos;
      attrs.push(
        `data-sourcepos="${start.line}:${start.column}-${end.line}:${end.column}"`,
      );
    }
    return `<h${level} ${attrs.join(" ")}>`;
  },
  exit: ({ level }) => `</h${level}>`,
};

const html = markdownToHTML("# Hello!\n\n## Subheading\n", options);
assert.strictEqual(
  html,
  '<h1 data-level="1" data-text="Hello!" data-sourcepos="1:1-1:8">Hello!</h1>\n' +
    '<h2 data-level="2" data-text="Subheading" data-sourcepos="3:1-3:13">Subheading</h2>',
);
```

---

## Install

Install via your preferred package manager:

```sh
deno add jsr:@nick/comrak
```

```sh
pnpm add jsr:@nick/comrak
```

```sh
yarn add jsr:@nick/comrak
```

```sh
bunx jsr add @nick/comrak
```

```sh
npx jsr add @nick/comrak
```

> [!IMPORTANT]
>
> Support for the `jsr:` protocol is available in PNPM v10.2+ and Yarn v4.2+. If
> you're using an older version of these package managers, you can use the `dlx`
> command instead.

```sh
pnpm dlx jsr add @nick/comrak
```

```sh
yarn dlx jsr add @nick/comrak
```

### [npm]

This package is also distributed on [npm] as [`comrak`][npm].

```sh
deno add npm:comrak
```

```sh
pnpm add comrak
```

```sh
yarn add comrak
```

```sh
bun add comrak
```

```sh
npm i comrak
```

---

## API

- `markdownToHTML(markdown, options?)` Render Markdown to HTML.
- `markdownToXML(markdown, options?)` Render Markdown to CommonMark XML.
- `markdownToCommonMark(markdown, options?)` Render Markdown back to CommonMark.
- `parseMarkdown(markdown, options?)` Parse Markdown into an AST.
- `renderHTML(ast, options?)` Render an AST to HTML.
- `renderXML(ast, options?)` Render an AST to CommonMark XML.
- `renderCommonMark(ast, options?)` Render an AST to CommonMark text.
- `Options.default()` Get a fresh, fully-populated options object.
- `HeadingAdapter` / `SyntaxHighlighterAdapter` Plug custom heading rendering or
  code fence highlighting into Comrak.

---

## Options

The `Options` interface mirrors the Rust crate's configuration surface, spanning
[extensions], [parsing], [rendering], and [plugins].

[extensions]: #extensionoptions
[parsing]: #parseoptions
[rendering]: #renderoptions
[plugins]: #plugins

### `ExtensionOptions`

- **`autolink?: boolean`** Enables the autolink extension (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Hello www.github.com.\n", {
    extension: { autolink: true },
  });

  assert.strictEqual(
    html,
    '<p>Hello <a href="http://www.github.com">www.github.com</a>.</p>\n',
  );
  ```

- **`descriptionLists?: boolean`** Enables description lists (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Term\n\n: Definition", {
    extension: { descriptionLists: true },
  });

  assert.strictEqual(
    html,
    "<dl>\n<dt>Term</dt>\n<dd>\n<p>Definition</p>\n</dd>\n</dl>\n",
  );
  ```

- **`footnotes?: boolean`** Enables footnotes support (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Hi[^x].\n\n[^x]: A greeting.\n", {
    extension: { footnotes: true },
  });

  assert.strictEqual(
    html,
    '<p>Hi<sup class="footnote-ref"><a href="#fn-x" id="fnref-x" data-footnote-ref>1</a></sup>.</p>\n' +
      '<section class="footnotes" data-footnotes>\n<ol>\n<li id="fn-x">\n<p>A greeting. <a href="#fnref-x" class="footnote-backref" data-footnote-backref data-footnote-backref-idx="1" aria-label="Back to reference 1">↩</a></p>\n</li>\n</ol>\n</section>\n',
  );
  ```

- **`inlineFootnotes?: boolean`** Enables inline footnotes (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML, Options } from "@nick/comrak";

  const options = Options.default();
  options.extension.footnotes = true;
  options.extension.inlineFootnotes = true;

  const html = markdownToHTML("Hi^[An inline note].\n", options);
  assert.strictEqual(
    html,
    '<p>Hi<sup class="footnote-ref"><a href="#fn-__inline_1" id="fnref-__inline_1" data-footnote-ref>1</a></sup>.</p>\n' +
      '<section class="footnotes" data-footnotes>\n<ol>\n<li id="fn-__inline_1">\n<p>An inline note <a href="#fnref-__inline_1" class="footnote-backref" data-footnote-backref data-footnote-backref-idx="1" aria-label="Back to reference 1">↩</a></p>\n</li>\n</ol>\n</section>\n',
  );
  ```

- **`frontMatterDelimiter?: string | null`** Processes front matter. Defaults to
  `"---"`.

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("---\nlayout: post\n---\nText\n", {
    extension: { frontMatterDelimiter: "---" },
  });

  assert.strictEqual(html, "<p>Text</p>\n");
  ```

- **`headerIDs?: string | null`** Generates header IDs with an optional prefix
  (default: `""`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("# README\n", {
    extension: { headerIDs: "user-content-" },
  });

  assert.strictEqual(
    html,
    '<h1><a href="#readme" aria-hidden="true" class="anchor" id="user-content-readme"></a>README</h1>\n',
  );
  ```

- **`table?: boolean`** Enables table support (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("| a | b |\n|---|---|\n| c | d |\n", {
    extension: { table: true },
  });

  assert.strictEqual(
    html,
    "<table>\n<thead>\n<tr>\n<th>a</th>\n<th>b</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>c</td>\n<td>d</td>\n</tr>\n</tbody>\n</table>\n",
  );
  ```

- **`tagfilter?: boolean`** Filters disallowed raw HTML tags (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Hello <xmp>.\n\n<xmp>", {
    extension: { tagfilter: true },
    render: { unsafe: true },
  });

  assert.strictEqual(html, "<p>Hello &lt;xmp>.</p>\n&lt;xmp>\n");
  ```

- **`tasklist?: boolean`** Enables task list items (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("* [x] Done\n* [ ] Not done\n", {
    extension: { tasklist: true },
  });

  assert.strictEqual(
    html,
    '<ul>\n<li><input type="checkbox" checked="" disabled="" /> Done</li>\n<li><input type="checkbox" disabled="" /> Not done</li>\n</ul>\n',
  );
  ```

- **`multilineBlockQuotes?: boolean`** Enables multiline block quotes (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML(">>>\nparagraph\n>>>", {
    extension: { multilineBlockQuotes: true },
  });

  assert.strictEqual(html, "<blockquote>\n<p>paragraph</p>\n</blockquote>\n");
  ```

- **`alerts?: boolean`** Enables GitHub-style alerts (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("> [!note]\n> Something of note", {
    extension: { alerts: true },
  });

  assert.strictEqual(
    html,
    '<div class="markdown-alert markdown-alert-note">\n<p class="markdown-alert-title">Note</p>\n<p>Something of note</p>\n</div>\n',
  );
  ```

- **`mathDollars?: boolean`** Enables math using dollar syntax (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("$1 + 2$ and $$x = y$$", {
    extension: { mathDollars: true },
  });

  assert.strictEqual(
    html,
    '<p><span data-math-style="inline">1 + 2</span> and <span data-math-style="display">x = y</span></p>\n',
  );
  ```

- **`mathCode?: boolean`** Enables math using code syntax (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("$`1 + 2`$", {
    extension: { mathCode: true },
  });

  assert.strictEqual(
    html,
    '<p><code data-math-style="inline">1 + 2</code></p>\n',
  );
  ```

- **`wikilinksTitleBeforePipe?: boolean`** Enables wikilinks where the title is
  before the pipe (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("[[link label|url]]", {
    extension: { wikilinksTitleBeforePipe: true },
  });

  assert.strictEqual(
    html,
    '<p><a href="url" data-wikilink="true">link label</a></p>\n',
  );
  ```

- **`wikilinksTitleAfterPipe?: boolean`** Enables wikilinks where the title is
  after the pipe (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("[[url|link label]]", {
    extension: { wikilinksTitleAfterPipe: true },
  });

  assert.strictEqual(
    html,
    '<p><a href="url" data-wikilink="true">link label</a></p>\n',
  );
  ```

- **`underline?: boolean`** Enables underlines using double underscores
  (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("__underlined text__", {
    extension: { underline: true },
  });

  assert.strictEqual(html, "<p><u>underlined text</u></p>\n");
  ```

- **`strikethrough?: boolean`** Enables strikethrough formatting (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Hello ~world~ there.\n", {
    extension: { strikethrough: true },
  });

  assert.strictEqual(html, "<p>Hello <del>world</del> there.</p>\n");
  ```

- **`superscript?: boolean`** Enables superscript formatting (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("e = mc^2^.\n", {
    extension: { superscript: true },
  });

  assert.strictEqual(html, "<p>e = mc<sup>2</sup>.</p>\n");
  ```

- **`subscript?: boolean`** Enables subscript text using single tildes (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("H~2~O", {
    extension: { subscript: true },
  });

  assert.strictEqual(html, "<p>H<sub>2</sub>O</p>\n");
  ```

- **`spoiler?: boolean`** Enables spoilers using double vertical bars (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Darth Vader is ||Luke's father||", {
    extension: { spoiler: true },
  });

  assert.strictEqual(
    html,
    '<p>Darth Vader is <span class="spoiler">Luke\'s father</span></p>\n',
  );
  ```

- **`greentext?: boolean`** Requires a space after `>` for blockquotes (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML(">implying implications", {
    extension: { greentext: true },
  });

  assert.strictEqual(html, "<p>&gt;implying implications</p>\n");
  ```

- **`shortcodes?: boolean`** Replaces `:emoji:` shortcodes (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Happy Friday! :smile:", {
    extension: { shortcodes: true },
  });

  assert.strictEqual(html, "<p>Happy Friday! 😄</p>\n");
  ```

- **`imageURLRewriter?: URLRewriter | null`** Rewrites image URLs (default:
  `null`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML, Options } from "@nick/comrak";

  const options = Options.default();
  options.extension.imageURLRewriter = (url: string) =>
    `https://cdn.example.com/images/${encodeURIComponent(url)}`;

  const html = markdownToHTML("![alt text](image.png)", options);
  assert.strictEqual(
    html,
    '<p><img src="https://cdn.example.com/images/image.png" alt="alt text" /></p>\n',
  );
  ```

- **`linkURLRewriter?: URLRewriter | null`** Rewrites link URLs (default:
  `null`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML, Options } from "@nick/comrak";

  const options = Options.default();
  options.extension.linkURLRewriter = (url: string) =>
    `https://safe.example.com/norefer?url=${encodeURIComponent(url)}`;

  const html = markdownToHTML(
    "[my link](http://unsafe.example.com/bad)",
    options,
  );
  assert.strictEqual(
    html,
    '<p><a href="https://safe.example.com/norefer?url=http%3A%2F%2Funsafe.example.com%2Fbad">my link</a></p>\n',
  );
  ```

- **`cjkFriendlyEmphasis?: boolean`** Recognizes emphasis in CJK contexts
  (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("**この文は重要です。**但这句话并不重要。", {
    extension: { cjkFriendlyEmphasis: true },
  });

  assert.strictEqual(
    html,
    "<p><strong>この文は重要です。</strong>但这句话并不重要。</p>\n",
  );
  ```

- **`subtext?: boolean`** Enables block-scoped subtext (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML, Options } from "@nick/comrak";

  const options = Options.default();
  options.extension.subtext = true;

  const html = markdownToHTML("-# subtext", options);
  assert.strictEqual(html, "<p><sub>subtext</sub></p>\n");
  ```

- **`highlight?: boolean`** Enables highlighting using `==` (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML, Options } from "@nick/comrak";

  const options = Options.default();
  options.extension.highlight = true;

  const html = markdownToHTML("Hey, ==this is important==!", options);
  assert.strictEqual(html, "<p>Hey, <mark>this is important</mark>!</p>\n");
  ```

### `ParseOptions`

- **`defaultInfoString?: string | null`** Default info string for fenced code
  blocks (default: `null`).

  ````ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  assert.strictEqual(
    markdownToHTML("```\nfn hello();\n```\n"),
    "<pre><code>fn hello();\n</code></pre>\n",
  );

  assert.strictEqual(
    markdownToHTML("```\nfn hello();\n```\n", {
      parse: { defaultInfoString: "rust" },
    }),
    '<pre><code class="language-rust">fn hello();\n</code></pre>\n',
  );
  ````

- **`smart?: boolean`** Enable smart punctuation conversion (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  assert.strictEqual(
    markdownToHTML("'Hello,' \"world\" ..."),
    "<p>'Hello,' &quot;world&quot; ...</p>\n",
  );

  assert.strictEqual(
    markdownToHTML("'Hello,' \"world\" ...", { parse: { smart: true } }),
    "<p>‘Hello,’ “world” …</p>\n",
  );
  ```

- **`relaxedTasklistMatching?: boolean`** Allow symbols beyond `x`/`X` for
  tasklists (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const markdown =
    "* [x] Done\n* [ ] Not done\n* [-] Also done\n* [ ] Also not done\n";

  const relaxed = markdownToHTML(markdown, {
    extension: { tasklist: true },
    parse: { relaxedTasklistMatching: true },
  });
  assert.strictEqual(
    relaxed,
    '<ul>\n<li><input type="checkbox" checked="" disabled="" /> Done</li>\n<li><input type="checkbox" disabled="" /> Not done</li>\n<li><input type="checkbox" checked="" disabled="" /> Also done</li>\n<li><input type="checkbox" disabled="" /> Also not done</li>\n</ul>\n',
  );

  const strict = markdownToHTML(markdown, {
    extension: { tasklist: true },
    parse: { relaxedTasklistMatching: false },
  });
  assert.strictEqual(
    strict,
    '<ul>\n<li><input type="checkbox" checked="" disabled="" /> Done</li>\n<li><input type="checkbox" disabled="" /> Not done</li>\n<li>[-] Also done</li>\n<li><input type="checkbox" disabled="" /> Also not done</li>\n</ul>\n',
  );
  ```

- **`tasklistInTable?: boolean`** Parse tasklist items inside tables (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML, Options } from "@nick/comrak";

  const options = Options.default();
  options.extension.table = true;
  options.extension.tasklist = true;

  const markdown = "| val |\n| - |\n| [ ] |\n";
  assert.strictEqual(
    markdownToHTML(markdown, options),
    "<table>\n<thead>\n<tr>\n<th>val</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>[ ]</td>\n</tr>\n</tbody>\n</table>\n",
  );

  options.parse.tasklistInTable = true;
  assert.strictEqual(
    markdownToHTML(markdown, options),
    '<table>\n<thead>\n<tr>\n<th>val</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>\n<input type="checkbox" disabled="" /> </td>\n</tr>\n</tbody>\n</table>\n',
  );
  ```

- **`relaxedAutolinks?: boolean`** Detect links inside brackets and allow all
  URL schemes (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("[https://foo.com]", {
    extension: { autolink: true },
    parse: { relaxedAutolinks: true },
  });

  assert.strictEqual(
    html,
    '<p>[<a href="https://foo.com">https://foo.com</a>]</p>\n',
  );
  ```

- **`ignoreSetext?: boolean`** Ignore setext headings in input (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("setext heading\n---", {
    parse: { ignoreSetext: true },
  });

  assert.strictEqual(html, "<p>setext heading</p>\n<hr />\n");
  ```

- **`brokenLinkCallback?: BrokenLinkCallback | null`** Handle undefined link
  references (default: `null`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML, Options } from "@nick/comrak";

  const options = Options.default();
  options.parse.brokenLinkCallback = (ref) => ({
    url: "https://img.shields.io/badge/placeholder-lightgrey.svg",
    title: `Placeholder Badge (original: ${ref.original})`,
  });

  const html = markdownToHTML("![Build Status][undefined-badge]\n", options);
  assert.strictEqual(
    html,
    '<p><img src="https://img.shields.io/badge/placeholder-lightgrey.svg" alt="Build Status" title="Placeholder Badge (original: undefined-badge)" /></p>\n',
  );
  ```

- **`leaveFootnoteDefinitions?: boolean`** Keep footnote definitions in place
  within the AST (default: `false`).

  ```ts
  import assert from "node:assert";
  import { Options, parseMarkdown, renderCommonMark } from "@nick/comrak";

  const options = Options.default();
  options.extension.footnotes = true;
  options.parse.leaveFootnoteDefinitions = true;

  const ast = parseMarkdown("Hi[^x].\n\n[^x]: A greeting.\n", options);
  const cm = renderCommonMark(ast, options);

  assert.strictEqual(cm, "Hi[^x].\n\n[^x]:\n    A greeting.\n");
  ```

- **`escapedCharSpans?: boolean`** Keep escaped characters as spans in the AST
  (default: `false`). Enabling `render.escapedCharSpans` also enables this.

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Notify user \\@example", {
    render: { escapedCharSpans: true },
  });

  assert.strictEqual(
    html,
    "<p>Notify user <span data-escaped-char>@</span>example</p>\n",
  );
  ```

### `RenderOptions`

- **`escape?: boolean`** Escape raw HTML instead of clobbering it (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  assert.strictEqual(
    markdownToHTML("<i>italic text</i>"),
    "<p><!-- raw HTML omitted -->italic text<!-- raw HTML omitted --></p>\n",
  );

  assert.strictEqual(
    markdownToHTML("<i>italic text</i>", { render: { escape: true } }),
    "<p>&lt;i&gt;italic text&lt;/i&gt;</p>\n",
  );
  ```

- **`githubPreLang?: boolean`** Use GitHub-style `<pre lang="xyz">` for fenced
  code blocks (default: `false`).

  ````ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  assert.strictEqual(
    markdownToHTML("```rust\nfn hello();\n```\n", {
      render: { githubPreLang: true },
    }),
    '<pre lang="rust"><code>fn hello();\n</code></pre>\n',
  );
  ````

- **`hardbreaks?: boolean`** Convert soft line breaks to hard breaks (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  assert.strictEqual(
    markdownToHTML("Hello.\nWorld.\n"),
    "<p>Hello.\nWorld.</p>\n",
  );

  assert.strictEqual(
    markdownToHTML("Hello.\nWorld.\n", { render: { hardbreaks: true } }),
    "<p>Hello.<br />\nWorld.</p>\n",
  );
  ```

- **`unsafe?: boolean`** Allow rendering of raw HTML and potentially dangerous
  links (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const markdown = "<script>\nalert('xyz');\n</script>\n\n" +
    "Possibly <marquee>annoying</marquee>.\n\n" +
    "[Dangerous](javascript:alert(document.cookie)).\n\n" +
    "[Safe](http://commonmark.org).";

  assert.strictEqual(
    markdownToHTML(markdown),
    "<!-- raw HTML omitted -->\n" +
      "<p>Possibly <!-- raw HTML omitted -->annoying<!-- raw HTML omitted -->.</p>\n" +
      '<p><a href="">Dangerous</a>.</p>\n' +
      '<p><a href="http://commonmark.org">Safe</a>.</p>\n',
  );

  assert.strictEqual(
    markdownToHTML(markdown, { render: { unsafe: true } }),
    "<script>\nalert('xyz');\n</script>\n" +
      "<p>Possibly <marquee>annoying</marquee>.</p>\n" +
      '<p><a href="javascript:alert(document.cookie)">Dangerous</a>.</p>\n' +
      '<p><a href="http://commonmark.org">Safe</a>.</p>\n',
  );
  ```

- **`width?: number`** Wrap column for CommonMark output (default: `0`).

  ```ts
  import assert from "node:assert";
  import { markdownToCommonMark } from "@nick/comrak";

  const markdown =
    "Hello, **world**!\n\nNew line of text that should wrap when width is set.\n";

  assert.strictEqual(
    markdownToCommonMark(markdown),
    "Hello, **world**\\!\n\nNew line of text that should wrap when width is set.\n",
  );

  assert.strictEqual(
    markdownToCommonMark(markdown, { render: { width: 20 } }),
    "Hello, **world**\\!\n\nNew line of text\nthat should wrap\nwhen width is set.\n",
  );
  ```

- **`fullInfoString?: boolean`** Use the full info string for fenced code blocks
  (default: `false`).

  ````ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("```rust extra info\nfn hello();\n```\n", {
    render: { fullInfoString: true },
  });

  assert.strictEqual(
    html,
    '<pre><code data-meta="extra info" class="language-rust">fn hello();\n</code></pre>\n',
  );
  ````

- **`listStyle?: "dash" | "plus" | "star"`** List marker style for CommonMark
  output (default: `"dash"`).

  ```ts
  import assert from "node:assert";
  import { markdownToCommonMark } from "@nick/comrak";

  assert.strictEqual(
    markdownToCommonMark("* Item\n* Item\n", { render: { listStyle: "star" } }),
    "* Item\n* Item\n",
  );

  assert.strictEqual(
    markdownToCommonMark("* Item\n* Item\n", { render: { listStyle: "dash" } }),
    "- Item\n- Item\n",
  );
  ```

- **`sourcepos?: boolean`** Include source position attributes (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Hello *world*!", {
    render: { sourcepos: true },
  });

  assert.strictEqual(
    html,
    '<p data-sourcepos="1:1-1:14">Hello <em data-sourcepos="1:7-1:13">world</em>!</p>\n',
  );
  ```

- **`escapedCharSpans?: boolean`** Wrap escaped characters in `<span>` tags
  (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Notify user \\@example", {
    render: { escapedCharSpans: true },
  });

  assert.strictEqual(
    html,
    "<p>Notify user <span data-escaped-char>@</span>example</p>\n",
  );
  ```

- **`ignoreEmptyLinks?: boolean`** Ignore empty links in input (default:
  `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("[]()", {
    render: { ignoreEmptyLinks: true },
  });

  assert.strictEqual(html, "<p>[]()</p>\n");
  ```

- **`gfmQuirks?: boolean`** Enable GFM quirks in HTML output (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("****abcd****", {
    render: { gfmQuirks: true },
  });

  assert.strictEqual(html, "<p><strong>abcd</strong></p>\n");
  ```

- **`preferFenced?: boolean`** Prefer fenced code blocks in CommonMark output
  (default: `false`).

  ````ts
  import assert from "node:assert";
  import { markdownToCommonMark } from "@nick/comrak";

  assert.strictEqual(
    markdownToCommonMark("    indented code\n"),
    "    indented code\n",
  );

  assert.strictEqual(
    markdownToCommonMark("    indented code\n", {
      render: { preferFenced: true },
    }),
    "```\nindented code\n```\n",
  );
  ````

- **`figureWithCaption?: boolean`** Render images as `<figure>` elements with
  captions (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML(
    '![image](https://example.com/image.png "this is an image")',
    { render: { figureWithCaption: true } },
  );

  assert.strictEqual(
    html,
    '<p><figure><img src="https://example.com/image.png" alt="image" title="this is an image" /><figcaption>this is an image</figcaption></figure></p>\n',
  );
  ```

- **`tasklistClasses?: boolean`** Add task list CSS classes (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("- [ ] Foo", {
    extension: { tasklist: true },
    render: { tasklistClasses: true },
  });

  assert.strictEqual(
    html,
    '<ul class="contains-task-list">\n<li class="task-list-item"><input type="checkbox" class="task-list-item-checkbox" disabled="" /> Foo</li>\n</ul>\n',
  );
  ```

- **`olWidth?: number`** Minimum marker width when rendering ordered lists
  (default: `0`).

  ```ts
  import assert from "node:assert";
  import { markdownToHTML } from "@nick/comrak";

  const markdown = "1. one\n10. ten\n";

  assert.strictEqual(
    markdownToHTML(markdown, { render: { olWidth: 0 } }),
    "<ol>\n<li>one</li>\n<li>ten</li>\n</ol>\n",
  );

  assert.strictEqual(
    markdownToHTML(markdown, { render: { olWidth: 3 } }),
    "<ol>\n<li>one</li>\n<li>ten</li>\n</ol>\n",
  );
  ```

- **`experimentalMinimizeCommonmark?: boolean`** Minimize escapes in CommonMark
  output (default: `false`).

  ```ts
  import assert from "node:assert";
  import { markdownToCommonMark } from "@nick/comrak";

  assert.strictEqual(
    markdownToCommonMark("Hello, **world**!\n"),
    "Hello, **world**\\!\n",
  );

  assert.strictEqual(
    markdownToCommonMark("Hello, **world**!\n", {
      render: { experimentalMinimizeCommonmark: true },
    }),
    "Hello, **world**!\n",
  );
  ```

### Plugins

- **`render.codefenceSyntaxHighlighter`** Plug in custom syntax highlighting.
  See the [plugin example](#usage) above for a minimal adapter that injects
  custom `<pre>`/`<code>` tags and HTML.
- **`render.headingAdapter`** Customize heading rendering. The heading adapter
  example in the [usage section](#usage) demonstrates adding data attributes and
  propagating source positions.

---

## Further Reading

### Compatibility

This package is designed to work seamlessly across multiple JavaScript runtimes.
While [the original `comrak` module] required the Deno runtime, this fork boasts
wide compatibility that's been verified to run on Deno, Node.js, Bun, Cloudflare
Workers, and even web browsers. Theoretically, it should be fully compatible by
any JavaScript runtime that supports WebAssembly.

### Under the Hood

`@nick/comrak` is built using a combination of Rust, WebAssembly, and
TypeScript. Internally, this project wraps the [`comrak`] crate by
[Talya Connor] with the necessary Rust to generate a WebAssembly module.

#### Compilation

The WebAssembly is built using [`@deno/wasmbuild`], and inlined into a
JavaScript file for portability and the best compatibility. The [API] that is
exposed as a thin TypeScript wrapper around the generated JavaScript bindings,
consisting mostly of type definitions.

#### Compression

The [brotli] compression algorithm is used to compress the WebAssembly binary
during the build step, making it ~75% smaller and a **lot** quicker to load.
Decompression is performed immediately on import with [`debrotli`].

#### Performance Gains

When all is said and done, this results in a **_very_** snappy experience for
users, with minimal overhead during initial load and fast Markdown rendering
times. It also reduces the amount of data transferred over the network, making
it ideal for use in web applications and serverless environments.

### Motivation

The original `comrak` module was published on the Deno registry, which cannot be
used as a dependency in other JavaScript runtimes. JSR has forbidden the use of
HTTPS-based dependencies in all of its packages (yup, including deno.land),
thereby rendering the original `comrak` module incompatible with JSR. And thus,
`@nick/comrak` was born, on an overcast Saturday evening in late March of 2025.

---

<div align="center">

**[MIT] · Made with ❤️ by [Nicholas Berlette]**

<small>

[github] · [issues] · [jsr] · [npm] · [docs]

</small>
</div>

---

[MIT]: https://nick.mit-license.org "MIT License. Copyright (c) Nicholas Berlette. All rights reserved."
[API]: https://jsr.io/@nick/comrak/doc "View the API documentation for @nick/comrak"
[docs]: https://jsr.io/@nick/comrak/doc "View the API documentation for @nick/comrak"
[GitHub]: https://github.com/nberlette/comrak-wasm#readme "Give this project a star on GitHub! ⭐"
[issues]: https://github.com/nberlette/comrak-wasm/issues "Report an issue or suggest a feature on GitHub"
[JSR]: https://jsr.io/@nick/comrak "View the @nick/comrak package on JSR: The JavaScript Registry"
[npm]: https://npmjs.com/package/comrak "View the comrak package on npm"
[Nicholas Berlette]: https://github.com/nberlette "Follow @nberlette on GitHub for more cool projects!"
[Talya Connor]: https://kivikakk.ee "View Talya Connor's Personal Website"
[`@nick/comrak`]: https://jsr.io/@nick/comrak "View the @nick/comrak package on the JavaScript Registry"
[`comrak`]: https://github.com/kivikakk/comrak "View the comrak GitHub repository"
[the original `comrak` module]: https://deno.land/x/comrak "View the original comrak module on Deno"
[`@deno/wasmbuild`]: https://jsr.io/@deno/wasmbuild "View the @deno/wasmbuild GitHub repository"
[`debrotli`]: https://npmjs.com/package/debrotli "View the debrotli package on npm"
[brotli]: https://github.com/google/brotli "View the Brotli GitHub repository"
