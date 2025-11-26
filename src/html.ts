/**
 * This module provides the functionality to convert Markdown documents into
 * HTML, either in a single step (from Markdown text to HTML text) or by
 * rendering an existing abstract syntax tree ({@linkcode AST}) into HTML.
 *
 * @see {@linkcode markdownToHTML} to convert Markdown to HTML.
 * @see {@linkcode renderHTML} to render an existing {@linkcode AST} into HTML.
 * @see {@linkcode parseMarkdown} to parse Markdown into an {@linkcode AST}.
 *
 * @module html
 */
import wasm from "./_wasm.ts";
import { collectOptions } from "./_internal.ts";
import type { AST } from "./nodes.ts";
import type { Options } from "./options.ts";

/**
 * Render Markdown to HTML.
 *
 * @param markdown The Markdown string to be converted.
 * @param [options] Options to customize the conversion.
 * @returns The generated HTML string.
 * @example
 * ```ts
 * import assert from "node:assert";
 * import { markdownToHTML } from "@nick/comrak";
 *
 * const html = markdownToHTML("Hello, **Nick**!");
 * assert.strictEqual(html, "<p>Hello, <strong>Nick</strong>!</p>\n");
 * ```
 * @category Conversion
 */
export function markdownToHTML(markdown: string, options?: Options): string {
  const args = collectOptions(options);
  return wasm.markdown_to_html(markdown, ...args);
}

/**
 * Formats an abstract syntax tree (AST), produced by parsing a Markdown
 * document with the {@linkcode parseMarkdown} function, into HTML text.
 *
 * **Note**: This is a low-level function that is primarily intended for
 * advanced use cases where direct manipulation of the AST is required. If you
 * simply want to convert a Markdown document into HTML, you should consider
 * using the single-step {@linkcode markdownToHTML} function instead.
 *
 * @param ast The AST to be formatted.
 * @param [options] Options to customize the formatting.
 * @returns The generated HTML string.
 * @see {@linkcode parseMarkdown} to parse Markdown into an {@linkcode AST}.
 * @example
 * ```ts
 * import { renderHTML, parseMarkdown, type Options } from "@nick/comrak";
 * import assert from "node:assert";
 *
 * const options = {
 *   extension: {
 *     alerts: true,
 *     footnotes: true,
 *   },
 * } satisfies Options;
 *
 * const ast = parseMarkdown("# Hello, world!\n\nHow are you?", options);
 * const html = renderHTML(ast, options);
 * assert.strictEqual(html, "<h1>Hello, world!</h1>\n<p>How are you?</p>\n");
 * ```
 * @category Rendering
 */
export function renderHTML(ast: AST, options?: Options): string {
  const args = collectOptions(options);
  return wasm.format_html(ast, ...args);
}
