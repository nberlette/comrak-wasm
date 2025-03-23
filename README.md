# [`@nick/comrak`]

<big>High-performance Markdown to HTML converter powered by WebAssembly.</big>

---

## Overview

`@nick/comrak` is a fast and efficient Markdown to HTML converter written in
Rust, compiled to WebAssembly, and wrapped with a high-level TypeScript API.

## Usage

Convert Markdown to HTML with a single function call:

```ts
import { markdownToHTML } from "@nick/comrak";

const markdown = "# Hello, **world**!";
const html = markdownToHTML(markdown);

console.log(html);
// Output: <h1>Hello, <strong>world</strong>!</h1>
```

---

## Install

Install via your preferred platform:

### Deno

```sh
deno add jsr:@nick/comrak
```

### Node.js (npx)

```sh
npx jsr add @nick/comrak
```

### Bun

```sh
bunx jsr add @nick/comrak
```

### pnpm

```sh
pnpm dlx jsr add @nick/comrak
```

### Yarn

```sh
yarn dlx jsr add @nick/comrak
```

---

## API

### `markdownToHTML(markdown: string, options?: ComrakOptions): string`

Render a Markdown string to HTML.

#### Parameters

- **`markdown`** (`string`): The Markdown content to be converted.
- **`options`** (_optional_, [`ComrakOptions`]): An object to customize the
  conversion process.

#### Returns

- **`string`**: The generated HTML string.

#### Example

```ts
import { markdownToHTML } from "@nick/comrak";

const html = markdownToHTML("Hello, **Markdown**!", {
  extension: { autolink: true, table: true },
  parse: { smart: true },
  render: { githubPreLang: true, hardbreaks: true },
});

console.log(html);
```

---

### `ComrakOptions`

An options object with the following properties:

- **`extension`** ([`ComrakExtensionOptions`])
  - Enables various CommonMark extensions and features.
- **`parse`** ([`ComrakParseOptions`])
  - Configure parse-time options.
- **`render`** ([`ComrakRenderOptions`])
  - Configure render-time options.

---

#### `ComrakExtensionOptions`

Customize Markdown extensions with the following options:

- **`autolink?: boolean`** Enables the autolink extension (default: `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Hello www.github.com.\n", {
    extension: { autolink: true },
  });
  console.log(html);
  // Output: <p>Hello <a href="http://www.github.com">www.github.com</a>.</p>
  ```

- **`descriptionLists?: boolean`** Enables description lists (default: `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Term\n\n: Definition", {
    extension: { descriptionLists: true },
  });
  console.log(html);
  // Output: <dl><dt>Term</dt><dd><p>Definition</p></dd></dl>
  ```

- **`footnotes?: boolean`** Enables footnotes support (default: `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Hi[^x].\n\n[^x]: A greeting.\n", {
    extension: { footnotes: true },
  });
  console.log(html);
  // Output includes footnote reference and section.
  ```

- **`frontMatterDelimiter?: string | null`** Processes front matter. Defaults to
  `"---"`.

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("---\nlayout: post\n---\nText\n", {
    extension: { frontMatterDelimiter: "---" },
  });
  console.log(html);
  // Output: <p>Text</p>
  ```

- **`headerIDs?: string | null`** Generates header IDs with an optional prefix
  (default: `""`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("# README\n", {
    extension: { headerIDs: "user-content-" },
  });
  console.log(html);
  // Output: <h1><a href="#readme" aria-hidden="true" class="anchor" id="user-content-readme"></a>README</h1>
  ```

- **`strikethrough?: boolean`** Enables strikethrough formatting (default:
  `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Hello ~world~ there.\n", {
    extension: { strikethrough: true },
  });
  console.log(html);
  // Output: <p>Hello <del>world</del> there.</p>
  ```

- **`superscript?: boolean`** Enables superscript formatting (default: `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("e = mc^2^.\n", {
    extension: { superscript: true },
  });
  console.log(html);
  // Output: <p>e = mc<sup>2</sup>.</p>
  ```

- **`table?: boolean`** Enables table support (default: `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const markdown = "| a | b |\n|---|---|\n| c | d |\n";
  const html = markdownToHTML(markdown, {
    extension: { table: true },
  });
  console.log(html);
  // Output: <table>...</table>
  ```

- **`tagfilter?: boolean`** Enables tag filtering for raw HTML (default:
  `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const html = markdownToHTML("Hello <xmp>.\n\n<xmp>", {
    extension: { tagfilter: true },
  });
  console.log(html);
  // Output: <p>Hello &lt;xmp>.</p> followed by raw escaped content.
  ```

- **`tasklist?: boolean`** Enables task list items (default: `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const markdown = "* [x] Done\n* [ ] Not done\n";
  const html = markdownToHTML(markdown, {
    extension: { tasklist: true },
  });
  console.log(html);
  // Output: <ul><li><input type="checkbox" disabled checked /> Done</li><li><input type="checkbox" disabled /> Not done</li></ul>
  ```

---

#### `ComrakParseOptions`

Configure parsing behavior with these options:

- **`defaultInfoString?: string | null`** The default info string for fenced
  code blocks (default: `null`).

  ````ts
  import { markdownToHTML } from "@nick/comrak";

  // Without a default info string:
  console.log(markdownToHTML("```\nfn hello();\n```\n"));
  // With a default info string:
  console.log(markdownToHTML("```\nfn hello();\n```\n", {
    parse: { defaultInfoString: "rust" },
  }));
  // Output: first call without language class, second call includes language class "rust".
  ````

- **`smart?: boolean`** Enable smart punctuation conversion (default: `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  // Without smart punctuation:
  console.log(markdownToHTML("'Hello,' \"world\" ..."));
  // With smart punctuation enabled:
  console.log(markdownToHTML("'Hello,' \"world\" ...", {
    parse: { smart: true },
  }));
  // Output: smart quotes and ellipsis in the second call.
  ```

---

#### `ComrakRenderOptions`

Adjust rendering options with the following settings:

- **`escape?: boolean`** Escape raw HTML (default: `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  // Raw HTML is omitted by default:
  console.log(markdownToHTML("<i>italic text</i>"));
  // With escaping enabled:
  console.log(markdownToHTML("<i>italic text</i>", {
    render: { escape: true },
  }));
  // Output: first call omits raw HTML, second call escapes it.
  ```

- **`githubPreLang?: boolean`** Use GitHub-style `<pre lang="xyz">` for fenced
  code blocks (default: `false`).

  ````ts
  import { markdownToHTML } from "@nick/comrak";

  const markdown = "```rust\nfn hello();\n```";
  const html = markdownToHTML(markdown, {
    render: { githubPreLang: true },
  });
  console.log(html);
  // Output: <pre lang="rust"><code>fn hello();</code></pre>
  ````

- **`hardbreaks?: boolean`** Convert soft line breaks to hard breaks (default:
  `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  // Without hard breaks:
  console.log(markdownToHTML("Hello.\nWorld.\n"));
  // With hard breaks enabled:
  console.log(markdownToHTML("Hello.\nWorld.\n", {
    render: { hardbreaks: true },
  }));
  // Output: second call inserts <br /> for line breaks.
  ```

- **`unsafe?: boolean`** Allow rendering of raw HTML and potentially dangerous
  links (default: `false`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const markdown = `<script>
  alert('xyz');
  </script>

  Possibly <marquee>annoying</marquee>.

  [Dangerous](javascript:alert(document.cookie)).

  [Safe](http://commonmark.org).`;

  // Without unsafe enabled:
  console.log(markdownToHTML(markdown));

  // With unsafe enabled:
  console.log(markdownToHTML(markdown, {
    render: { unsafe: true },
  }));
  // Output: < ... dangerous links and raw HTML rendered as-is ... >
  ```

- **`width?: number`** Specifies the wrap column for output (default: `0`).

  ```ts
  import { markdownToHTML } from "@nick/comrak";

  const markdown =
    "A very long paragraph that will be wrapped at a specific column width if set.";
  const html = markdownToHTML(markdown, {
    render: { width: 40 },
  });
  console.log(html);
  // Output: The text is wrapped to 40 characters per line.
  ```

---

## Features and Improvements

Forked from [Luca Casonato's `comrak`], this package modernizes the original
codebase with updated dependencies, Brotli compression instead of LZ4, and an
extended range of compatible runtimes.

- **Brotli Compression**: Switched from LZ4 to Brotli for enhanced efficiency.
- **Updated Dependencies**: Updated for better performance and security.
- **Improved Compatibility**: Works seamlessly with all WASM-friendly runtimes.

This project also marks the debut of the first `comrak` package to be published
on the JavaScript Registry (JSR), which was this fork's primary motivation.

<details><summary><strong><big><u>Click here</u> for a deep dive into <code>@nick/comrak</code></big></strong></summary>

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
during the build step, making it nearly 80% smaller and a lot quicker to load.
Decompression is performed Just-in-Time (JIT) immediately once the module is
imported, leveraging the native `node:zlib` module when available. In browsers
and any other runtime without support for `node:zlib`, it falls back to a WASM
decompressor from the [`debrotli`] package, which provides near-native speeds.

#### Performance Gains

When all is said and done, this results in a snappy experience for users, with
minimal overhead during initial load and fast Markdown rendering times. It also
reduces the amount of data transferred over the network, making it ideal for use
in web applications and serverless environments.

#### Motivation

The original `comrak` module was published on the Deno registry, which cannot be
used as a dependency in other JavaScript runtimes. JSR has forbidden the use of
HTTPS-based dependencies in all of its packages (yup, including deno.land),
thereby rendering the original `comrak` module incompatible with JSR. And thus,
`@nick/comrak` was born, on an overcast Saturday evening in late March of 2025.

</details>

---

### Thanks

Special thanks to [Luca Casonato] for his original work, which laid the
foundation for this package.

Additional appreciation goees out to [Talya Connor] for the amazing work on
their [`comrak`] crate — the heart of this project.

---

## License

Copyright (c) [Luca Casonato] and (c) [Nicholas Berlette]. All rights reserved.

This project is licensed under the [MIT] License.

---

[MIT]: https://opensource.org/licenses/MIT "Copyright (c) 2025 Nicholas Berlette, and (c) 2021 Luca Casonato"
[Nicholas Berlette]: https://github.com/nberlette "View Nicholas Berlette's GitHub profile"
[Luca Casonato]: https://github.com/lucacasonato "View Luca Casonato's GitHub profile"
[`comrak`]: https://github.com/kivikakk/comrak "View the comrak GitHub repository"
[Talya Connor]: https://kivikakk.ee "View Talya Connor's Personal Website"
[brotli]: https://github.com/google/brotli "View the Brotli GitHub repository"
[`debrotli`]: https://npmjs.com/package/debrotli "View the debrotli package on npm"
[`@deno/wasmbuild`]: https://jsr.io/@deno/wasmbuild "View the @deno/wasmbuild GitHub repository"
[API]: https://jsr.io/@nick/comrak/doc "View the API documentation for @nick/comrak"
[Luca Casonato's `comrak`]: https://deno.land/x/comrak "View the original comrak module"
[`@nick/comrak`]: https://jsr.io/@nick/comrak "View the @nick/comrak package on the JavaScript Registry"
[the original `comrak` module]: https://deno.land/x/comrak "View the original comrak module on Deno"
[`ComrakExtensionOptions`]: #comrakextensionoptions "Jump to the `ComrakExtensionOptions` section"
[`ComrakParseOptions`]: #comrakparseoptions "Jump to the `ComrakParseOptions` section"
[`ComrakRenderOptions`]: #comrakrenderoptions "Jump to the `ComrakRenderOptions` section"
[`ComrakOptions`]: #comrakoptions "Jump to the `ComrakOptions` section"
