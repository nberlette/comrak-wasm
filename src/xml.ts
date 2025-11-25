/**
 * This module provides the functionality to convert Markdown documents into
 * [CommonMark XML](https://commonmark.org/xml) format, either in a single step
 * (from Markdown text to CommonMark XML text) or by rendering an existing
 * abstract syntax tree ({@linkcode AST}) into XML.
 *
 * @see {@linkcode markdownToXML} to convert Markdown to CommonMark XML.
 * @see {@linkcode renderXML} to render an existing {@linkcode AST} into XML.
 * @see {@linkcode parseMarkdown} to parse Markdown into an {@linkcode AST}.
 *
 * @module xml
 */
import wasm from "./_wasm.ts";
import { collectOptions } from "./_internal.ts";
import type { AST } from "./nodes.ts";
import type { Options } from "./options.ts";

/**
 * Parses a Markdown document into an {@linkcode AST} and renders it back into
 * CommonMark XML format in a single step. This is equivalent to calling the
 * {@linkcode parseMarkdown} function followed by {@linkcode renderXML}.
 *
 * @param markdown The Markdown string to be converted.
 * @param [options] Options to customize the conversion.
 * @returns The generated XML string.
 * @example
 * ```ts
 * import assert from "node:assert";
 * import { markdownToXML } from "@nick/comrak";
 *
 * const xml = markdownToXML("Hello, **Nick**!");
 * assert.strictEqual(xml, '<?xml version="1.0" encoding="UTF-8"?>\n' +
 *   '<!DOCTYPE document SYSTEM "CommonMark.dtd">\n' +
 *   '<document xmlns="http://commonmark.org/xml/1.0">\n' +
 *   '  <paragraph>\n' +
 *   '    <text xml:space="preserve">Hello, </text>\n' +
 *   '    <strong>\n' +
 *   '      <text xml:space="preserve">Nick</text>\n' +
 *   '    </strong>\n' +
 *   '    <text xml:space="preserve">!</text>\n' +
 *   '  </paragraph>\n' +
 *   '</document>\n');
 * ```
 * @category Conversion
 * @tags xml
 */
export function markdownToXML(markdown: string, options?: Options): string {
  const args = collectOptions(options);
  return wasm.markdown_to_xml(markdown, ...args);
}

/**
 * Formats an abstract syntax tree (AST), produced by parsing a Markdown
 * document with the {@linkcode parseMarkdown} function, into CommonMark
 * XML text.
 *
 * **Note**: This is a low-level function that is primarily intended for
 * advanced use cases where direct manipulation of the AST is required. If you
 * simply want to convert a Markdown document into CommonMark XML, you should
 * consider using the single-step {@linkcode markdownToXML} function instead.
 *
 * @param ast The AST to be formatted.
 * @param [options] Options to customize the formatting.
 * @returns The generated XML string.
 * @see {@linkcode parseMarkdown} to parse Markdown into an {@linkcode AST}.
 * @example
 * ```ts
 * import { renderXML, parseMarkdown, type Options } from "@nick/comrak";
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
 * const xml = renderXML(ast, options);
 * assert.strictEqual(xml, '<?xml version="1.0" encoding="UTF-8"?>\n' +
 *   '<!DOCTYPE document SYSTEM "CommonMark.dtd">\n' +
 *   '<document xmlns="http://commonmark.org/xml/1.0">\n' +
 *   '  <heading level="1">\n' +
 *   '    <text xml:space="preserve">Hello, world!</text>\n' +
 *   '  </heading>\n' +
 *   '  <paragraph>\n' +
 *   '    <text xml:space="preserve">How are you?</text>\n' +
 *   '  </paragraph>\n' +
 *   '</document>\n');
 * ```
 * @category Rendering
 * @tags xml
 */
export function renderXML(ast: AST, options?: Options): string {
  const args = collectOptions(options);
  return wasm.format_xml(ast, ...args);
}
