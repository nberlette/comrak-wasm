/**
 * This module exposes the {@linkcode parseMarkdown} function for parsing
 * Markdown from text into an abstract syntax tree ({@linkcode AST}), which can
 * be further processed or manipulated and then rendered back into various
 * formats such as HTML, CommonMark, or CommonMark XML using the respective
 * rendering functions.
 *
 * @module parse
 */
import { parse_document } from "./_wasm.ts";
import { collectOptions } from "./_internal.ts";
import type { AST } from "./nodes.ts";
import type { Options } from "./options.ts";

/**
 * Parses a given Markdown document into an abstract syntax tree (AST), which
 * can be further processed or passed to one of the formatter functions:
 *
 * - {@linkcode renderHTML} - render an AST to an HTML document
 * - {@linkcode renderXML} - render an AST to a CommonMark XML document
 * - {@linkcode renderCommonMark} - render an AST back into CommonMark Markdown
 *
 * @param markdown The Markdown string to be parsed.
 * @param [options] Options to customize the parsing.
 * @returns The generated AST.
 * @example
 * ```ts
 * import { parseMarkdown, renderHTML } from "@nick/comrak";
 *
 * const markdown = "# Hello, **world**!\n\nThis is a sample __document__.";
 *
 * const ast = parseMarkdown(markdown, { extension: { underline: true } });
 * const html = renderHTML(ast);
 *
 * console.log(html);
 * ```
 * @category Parsing
 */
export function parseMarkdown(markdown: string, options?: Options): AST {
  const [opts, , , ...fns] = collectOptions(options);
  return parse_document(markdown, opts, ...fns);
}
