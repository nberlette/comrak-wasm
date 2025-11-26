/**
 * # [comrak][npm]
 *
 * This package provides WebAssembly bindings and a TypeScript API for the
 * [Comrak](https://crates.io/crates/comrak) crate, a blazing fast, highly
 * configurable Rust library for parsing Markdown documents and rendering them
 * into HTML, XML, or CommonMark format.
 *
 * - [x] Distributed on [npm] as [`comrak`][npm]
 * - [x] Distributed on [JSR] as [`@nick/comrak`][@nick/comrak]
 * - [x] CommonMark compliant parser with support for GFM extensions.
 * - [x] Extremely efficient: written in Rust, compiled to WebAssembly.
 * - [x] Multiple output formats: HTML, XML, and CommonMark.
 * - [x] Highly configurable: granular options for parsing, rendering, and
 *       fine-tuning of individual extensions to the specification.
 * - [x] Supports custom plugins for integrating external syntax highlighters,
 *       heading ID generators, and much more.
 * - [x] Straightforward TypeScript API with comprehensive, accurate types.
 * - [x] API aligns very closely with that of the native Comrak Rust API.
 *   - [x] Supports the same options and plugins as the original Rust crate.
 *   - [x] The `parseMarkdown` function corresponds to `comrak::parse_document`
 *   - [x] The `renderHTML`, `renderXML`, and `renderCommonMark` functions
 *         correspond to `comrak::format_html`, `comrak::format_xml`, and
 *         `comrak::format_commonmark`, respectively.
 *   - [x] The `markdownToHTML`, `markdownToXML`, and `markdownToCommonMark`
 *         convenience functions correspond to the same-named functions in Rust
 *         (e.g., `comrak::markdown_to_html`).
 * - [x] Compatible with any ES2015+ runtime that supports WebAssembly:
 *   - [x] [Deno] \(all versions\)
 *   - [x] [Bun] \(all versions\)
 *   - [x] [Node.js] \(v14+\)
 *   - [x] [Cloudflare Workers]
 *   - [x] [Vercel Edge Functions]
 *   - [x] [Netlify Edge Functions]
 *   - [x] Modern web browsers (Chrome, Firefox, Safari, Edge)
 *
 * [Comrak]: https://crates.io/crates/comrak "Comrak on crates.io"
 * [npm]: https://www.npmjs.com/package/comrak "comrak on npm"
 * [jsr]: https://jsr.io/@nick/comrak/doc "@nick/comrak on jsr.io"
 * [@nick/comrak]: https://jsr.io/@nick/comrak/doc "@nick/comrak on jsr.io"
 * [Deno]: https://deno.land "Deno: A secure runtime for JavaScript/TypeScript"
 * [Bun]: https://bun.sh "Bun: The fast all-in-one JavaScript runtime"
 * [Node.js]: https://nodejs.org "Node.js® is a JS runtime built on V8."
 * [Cloudflare Workers]: https://workers.cloudflare.com "Cloudflare Workers"
 * [Netlify Edge Functions]: https://docs.netlify.com/functions/edge-functions
 * [Vercel Edge Functions]: https://vercel.com/docs/functions "Vercel Functions"
 *
 * @example
 * ```ts
 * import comrak from "@nick/comrak";
 * import assert from "node:assert";
 *
 * const md = "# Hello, **world**!";
 *
 * // HTML
 * const html = comrak.markdownToHTML(md);
 * assert.strictEqual(html, "<h1>Hello, <strong>world</strong>!</h1>\n");
 *
 * // XML (CommonMark)
 * const xml = comrak.markdownToXML(md);
 * assert.strictEqual(xml, '<?xml version="1.0" encoding="UTF-8"?>\n' +
 *   '<!DOCTYPE document SYSTEM "CommonMark.dtd">\n' +
 *   '<document xmlns="http://commonmark.org/xml/1.0">\n' +
 *   '  <heading level="1">\n' +
 *   '    <text xml:space="preserve">Hello, </text>\n' +
 *   '    <strong>\n' +
 *   '      <text xml:space="preserve">world</text>\n' +
 *   '    </strong>\n' +
 *   '    <text xml:space="preserve">!</text>\n' +
 *   '  </heading>\n' +
 *   '</document>\n');
 *
 * // CommonMark
 * const cm = comrak.markdownToCommonMark(md);
 * assert.strictEqual(cm, "# Hello, **world**\\!\n");
 * ```
 * @example
 * ```ts
 * import * as comrak from "@nick/comrak";
 * import * as shiki from "npm:shiki";
 * import assert from "node:assert";
 *
 * const sh = await shiki.createHighlighter({
 *   themes: ["nord"],
 *   langs: ["typescript", "javascript", "rust", "bash"],
 * });
 *
 * // using custom options and extensions
 * const options = {
 *   extension: {
 *     tasklist: true,
 *     autolink: true,
 *     footnotes: true,
 *     linkURLRewriter(url) {
 *       return url.replace(/^http(?=:)/, "https");
 *     },
 *   },
 *   parse: {
 *     brokenLinkCallback(ref) {
 *       console.error("broken link!!!", ref);
 *       return { title: "Broken Link", url: "#broken-link" };
 *     },
 *   },
 *   plugins: {
 *     render: {
 *       codefenceSyntaxHighlighter: {
 *         highlight: (code, lang) =>
 *           sh.codeToHtml(code, {
 *             lang: lang ?? "ts",
 *             theme: "nord",
 *           }).match(/^(.+?)<\/code>/s)?.[1] ?? `<pre><code>${code}`,
 *         // prevent comrak from adding opening pre/code tags
 *         pre: () => "",
 *         code: () => "",
 *       },
 *     },
 *   },
 * } satisfies comrak.Options;
 *
 * const md = `# Hello, world!\n\n## Install\n\n\`\`\`bash\ndeno add jsr:@nick/comrak\n\`\`\`\n\n` +
 *   `- [ ] Task 1\n- [x] Task 2\n\nVisit http://example.com` +
 *   `\n\nSee the footnote.[^1]\n\n[^1]: This is the footnote.\n`;
 *
 * const html = comrak.markdownToHTML(md, options);
 *
 * console.log(html);
 *
 * assert.ok(html.includes('href="https://example.com"'));
 * assert.ok(html.includes('<pre class="shiki nord"'));
 * assert.ok(html.includes('<span style="color:#88C0D0">deno</span>'));
 * ```
 * @module comrak
 */
import type {
  ExtensionOptions,
  Options,
  ParseOptions,
  RenderOptions,
} from "./src/options.ts";

export * from "./src/adapters.ts";
export * from "./src/nodes.ts";
export * from "./src/cm.ts";
export * from "./src/html.ts";
export * from "./src/options.ts";
export * from "./src/parse.ts";
export * from "./src/xml.ts";

// legacy aliases

/** @deprecated Use the {@linkcode Options} type instead. */
export type ComrakOptions = Options;

/** @deprecated Use the {@linkcode ParseOptions} type instead. */
export type ComrakParseOptions = ParseOptions;

/** @deprecated Use the {@linkcode RenderOptions} type instead. */
export type ComrakRenderOptions = RenderOptions;

/** @deprecated Use the {@linkcode ExtensionOptions} type instead. */
export type ComrakExtensionOptions = ExtensionOptions;

// circular default export for CommonJS compatibility
export * as default from "./mod.ts";
