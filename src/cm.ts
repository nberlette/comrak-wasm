/**
 * This module provides the functionality to convert Markdown documents into
 * [CommonMark](https://commonmark.org/) format, either in a single step or by
 * formatting an existing abstract syntax tree ({@linkcode AST}).
 *
 * @see {@linkcode markdownToCommonMark} to convert Markdown to CommonMark.
 * @see {@linkcode renderCommonMark} to render an existing {@linkcode AST}.
 * @see {@linkcode parseMarkdown} to parse Markdown into an {@linkcode AST}.
 *
 * @module cm
 */
import wasm from "./_wasm.ts";
import { collectOptions } from "./_internal.ts";
import type { AST } from "./nodes.ts";
import type { Options } from "./options.ts";

/**
 * Parses a Markdown document into an {@linkcode AST}, rendering it back into
 * CommonMark format in a single step.
 *
 * This is equivalent to calling {@linkcode renderCommonMark} on the result of
 * the {@linkcode parseMarkdown} function.
 *
 * @param md The Markdown string to be converted.
 * @param [options] Options to customize the conversion.
 * @returns The generated CommonMark string.
 * @example
 * ```ts
 * import { markdownToCommonMark } from "@nick/comrak";
 * import assert from "node:assert";
 *
 * const cm = markdownToCommonMark("Hello, **_Nick_**!");
 * assert.strictEqual(cm, "Hello, ***Nick***\\!\n");
 * ```
 * @category Conversion
 */
export function markdownToCommonMark(md: string, options?: Options): string {
  const [opts, , , ...fns] = collectOptions(options);
  return wasm.markdown_to_commonmark(md, opts, null, null, ...fns);
}

/**
 * Formats an abstract syntax tree (AST), produced by parsing a Markdown
 * document with the {@linkcode parseMarkdown} function, into CommonMark text.
 *
 * **Note**: This is a low-level function that is primarily intended for
 * advanced use cases where direct manipulation of the AST is required. If you
 * simply want to convert a Markdown document into CommonMark, you should
 * consider the single-step {@linkcode markdownToCommonMark} functioninstead.
 *
 * @param ast The AST to be formatted.
 * @param [options] Options to customize the formatting.
 * @returns The generated CommonMark string.
 * @see {@linkcode parseMarkdown} to parse Markdown into an {@linkcode AST}.
 * @example
 * ```ts
 * import {
 *   renderCommonMark,
 *   parseMarkdown,
 *   type Options,
 * } from "@nick/comrak";
 * import assert from "node:assert";
 *
 * const options = {
 *   extension: {
 *     alert: true,
 *     footnotes: true,
 *   },
 * } satisfies Options;
 *
 * const ast = parseMarkdown("# Hello, world!\n\nHow are you?", options);
 * const cm = renderCommonMark(ast, options);
 * assert.strictEqual(cm, "# Hello, world\\!\n\nHow are you?\n");
 * ```
 * @category Rendering
 */
export function renderCommonMark(ast: AST, options?: Options): string {
  const [opts, , , ...fns] = collectOptions(options);
  return wasm.format_commonmark(ast, opts, null, null, ...fns);
}
