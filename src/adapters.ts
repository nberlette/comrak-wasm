/**
 * This module provides types and interfaces for adapters used in the Comrak
 * markdown processing library.
 *
 * @module adapters
 */
import type { Sourcepos } from "./nodes.ts";

/**
 * Metadata about a heading element, which is passed to the `enter` and `exit`
 * methods of the {@linkcode HeadingAdapter} API for custom heading rendering.
 *
 * @remarks
 * This object is not created by users directly, but rather is provided by the
 * Comrak library when invoking the `enter` and `exit` methods of a custom
 * {@linkcode HeadingAdapter} implementation.
 *
 * @category Adapters
 * @tags plugins, headings
 */
export interface HeadingMeta {
  /** The level of the heading (1-6). */
  level: number;
  /** The textual content of the heading. */
  content: string;
}

/**
 * The `HeadingAdapter` API allows you to customize how headings are rendered
 * by Comrak (`h1`, `h2`, ...) via custom `enter` and `exit` methods.
 *
 * The `enter` and `exit` methods define what is rendered before and after the
 * heading content, respectively. Both receive {@linkcode HeadingMeta} objects
 * for their contextual `this` binding and first argument, which provide them
 * with the heading level and content. The actual AST content of the heading
 * remains unchanged.
 *
 * ## Methods
 *
 * ### `enter`
 *
 * The `enter` method is called **once** for each heading immediately before
 * rendering its content, and as such, should render the opening tag and any
 * attributes it has.
 *
 * ### `exit`
 *
 * The `exit` method - also called **once** - is invoked immediately _after_
 * the heading content has been rendered, and should render the closing tag.
 *
 * ---
 *
 * ## Example
 *
 * Here's a brief demo of a `HeadingAdapter` that adds `id` attributes to
 * headings based on their content, as well as `data-sourcepos` attributes if
 * source position tracking is enabled:
 *
 * @example
 * ```ts
 * import { markdownToHTML, Options } from "@nick/comrak";
 * import assert from "node:assert";
 *
 * const options = Options.default();
 * options.plugins.render.headingAdapter = {
 *   enter: ({ level, content }, sourcepos) => {
 *     // rudimentary slugification example. don't actually use this!
 *     const id = content.replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
 *     let attrs = ` id="${id}"`;
 *     if (sourcepos) {
 *       const { start, end } = sourcepos;
 *       const { line: l1, column: c1 } = start;
 *       const { line: l2, column: c2 } = end;
 *       attrs += ` data-sourcepos="${l1}:${c1}-${l2}:${c2}"`;
 *     }
 *     return `<h${level}${attrs}>`
 *   },
 *   exit: ({ level }) => `</h${level}>`,
 * };
 *
 * const md = '# Hello!\n\n## Subheading\n\nBye!\n';
 *
 * const html = markdownToHTML(md, options);
 * assert.strictEqual(html,
 *   '<h1 id="hello" data-sourcepos="1:1-1:8">Hello!</h1>\n' +
 *   '<h2 id="subheading" data-sourcepos="3:1-3:12">Subheading</h2>\n' +
 *   '<p data-sourcepos="5:1-5:5">Bye!</p>\n'
 * );
 * ```
 * @category Adapters
 * @tags plugins, headings
 */
export interface HeadingAdapter {
  /**
   * Called when entering a heading element during rendering.
   *
   * @param heading Metadata about the heading being entered.
   * @param location Optional source position information for the heading.
   * @returns The HTML string to insert at the start of the heading.
   */
  enter(heading: HeadingMeta, location?: Sourcepos): string;
  /**
   * Called when exiting a heading element during rendering.
   *
   * @param heading Metadata about the heading being exited.
   * @returns The HTML string to insert at the end of the heading.
   */
  exit(heading: HeadingMeta): string;
}

/**
 * The `SyntaxHighlighterAdapter` API allows you to customize how code
 * fences/blocks are rendered by Comrak via custom `highlight`, `pre`, and
 * `code` methods.
 *
 * ## Methods
 *
 * ### `highlight`
 *
 * The `highlight` method is called to perform syntax highlighting on the raw
 * code content of a code block. It receives the code string and an optional
 * language identifier, and should return the highlighted HTML string. The HTML
 * returned by this method will be inserted inside the `<code>` element, and so
 * should not include any `<pre>` or `<code>` tags.
 *
 * **Note**: The returned HTML should *never* include a `</code>` or `</pre>`
 * tag, as those are added automatically by Comrak. However, if you wish to
 * inherit the opening `<pre>` and/or `<code>` tags from your highlighter's
 * output, you can do so by returning everything up to (but not including) the
 * closing `</code>` tag, as shown in the Shiki example file.
 *
 * If this is the route you take, be sure that your `pre` and `code` methods
 * both return empty strings to avoid duplicate tags.
 *
 * ### `pre`
 *
 * The `pre` method is called to render the `<pre>` element that wraps the code
 * block. It receives a single argument: an object mapping attribute names to
 * their values (e.g., `class`, `data-lang`, etc.). It should return the
 * opening `<pre>` tag with any necessary attributes included.
 *
 * ### `code`
 *
 * The `code` method is called to render the `<code>` element that contains the
 * highlighted code. It receives a single argument: an object mapping attribute
 * names to their values. It should return the opening `<code>` tag with any
 * necessary attributes included.
 *
 * ---
 *
 * ## Examples
 *
 * See the README.md file for examples of how to integrate external syntax
 * highlighters like Shiki or Prism with Comrak using this adapter. There are
 * also real-world sample scripts in the `examples/` directory of the repo.
 *
 * @category Adapters
 * @tags plugins, syntax-highlighting
 */
export interface SyntaxHighlighterAdapter {
  /**
   * Invoked with the raw `code` content and `lang` string (if one was given).
   * Should return the highlighted HTML to be inserted inside the `<code>` tag.
   *
   * @param code The raw code content.
   * @param [lang] The optional language identifier.
   * @returns The highlighted HTML string.
   */
  highlight(code: string, lang?: string | null): string;

  /**
   * Called to render the `<pre>` element that wraps the code block.
   *
   * @remarks
   * If not provided, a default implementation will be used that renders a
   * simple `<pre>` tag with its attributes serialized as standard HTML.
   *
   * @param attrs An object mapping attribute names to their values.
   * @returns The opening `<pre>` tag with any necessary attributes included.
   */
  pre?(attrs: Record<string, string>): string;

  /**
   * Called to render the `<code>` element that contains the highlighted code.
   *
   * @remarks
   * If not provided, a default implementation will be used that renders a
   * simple `<code>` tag with its attributes serialized as standard HTML.
   *
   * @param attrs An object mapping attribute names to their values.
   * @returns The opening `<code>` tag with any necessary attributes included.
   */
  code?(attrs: Record<string, string>): string;
}
