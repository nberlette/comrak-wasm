/**
 * This module exposes the various configuration options and plugins available
 * in the Comrak library, allowing you to customize the parsing and rendering
 * behavior to suit your specific needs.
 *
 * @module options
 */
import type { HeadingAdapter, SyntaxHighlighterAdapter } from "./adapters.ts";
import { cloneDeep, type RequiredDeep } from "./_internal.ts";

/**
 * Represents an optional value that can be of type `T`, or `null | undefined`.
 *
 * @remarks
 * This type corresponds to the `Option<T>` type in Rust, and is used to type
 * values that may or may not be present. In the context of this library, this
 * is used to represent optional parameters in various function signatures.
 *
 * @category Types
 */
export type Maybe<T> = T | null | undefined;

/**
 * Represents an undefined link reference encountered during parsing.
 *
 * @category Options
 * @tags parse
 */
export interface BrokenLinkReference {
  /** The normalized URL of the link that was broken. */
  normalized: string;
  /** The original URL of the link that was broken. */
  original: string;
}

/**
 * The result of resolving a broken link reference.
 *
 * @category Options
 * @tags parse
 */
export interface ResolvedReference {
  /** The title of the resolved reference. */
  title: string;
  /** The destination URL of the resolved reference. */
  url: string;
}

/**
 * When the Comrak parser encounters an image or link reference that does not
 * have a corresponding definition, the {@linkcode BrokenLinkCallback} will be
 * invoked (if provided) to allow custom handling of the broken reference.
 *
 * The callback receives a {@linkcode BrokenLinkReference} object containing
 * details about the broken link. It can return a {@linkcode ResolvedReference}
 * object (or `null` or `undefined`) to provide a fallback title / URL to use
 * for the broken link. If the callback returns `null` or `undefined`, the
 * original link will be preserved.
 *
 * @category Options
 * @tags parse
 */
export interface BrokenLinkCallbackFunction {
  (
    this: BrokenLinkReference,
    ref: BrokenLinkReference,
  ): Maybe<ResolvedReference>;
}

/**
 * Similar to the {@linkcode BrokenLinkCallbackFunction}, but implemented as an
 * object with a `resolve` method.
 *
 * @category Options
 * @tags parse
 */
export interface BrokenLinkCallbackImpl {
  resolve(ref: BrokenLinkReference): Maybe<ResolvedReference>;
}

/**
 * A type that represents either a function or an object for handling broken
 * link references.
 *
 * @see {@linkcode BrokenLinkCallbackFunction} for function-based handling.
 * @see {@linkcode BrokenLinkCallbackImpl} for object-based handling.
 * @category Options
 * @tags parse
 */
export type BrokenLinkCallback =
  | BrokenLinkCallbackFunction
  | BrokenLinkCallbackImpl;

/**
 * A function that rewrites URLs for images or links during rendering.
 *
 * @category Options
 * @tags extension
 */
export interface URLRewriterFunction {
  (url: string): string;
}

/**
 * An object that rewrites URLs for images or links during rendering.
 *
 * @category Options
 * @tags extension
 */
export interface URLRewriterImpl {
  toHTML(url: string): string;
}

/**
 * A type that represents either a function or an object for rewriting URLs.
 *
 * @see {@linkcode URLRewriterFunction} for function-based URL rewriting.
 * @see {@linkcode URLRewriterImpl} for object-based URL rewriting.
 * @category Options
 * @tags extension
 */
export type URLRewriter = URLRewriterFunction | URLRewriterImpl;

/**
 * Comrak's capabilities really shine through its highly configurable APIs. The
 * `Options` interface allows you to fine-tune each stage of the Markdown
 * processing pipeline, from parsing to rendering.
 *
 * Comrak also supports numerous extensions to the CommonMark specification,
 * enabling features like tables, footnotes, autolinks, task lists, description
 * lists, HTML tag filtering, and much more. You can also customize Comrak's
 * behavior further through its extensible {@linkcode Plugins} API, allowing
 * for integration with external syntax highlighters, heading ID slugifiers,
 * and other capabilities.
 *
 * These options can be passed to any of Comrak's main functions:
 *
 * - {@link markdownToHTML}
 * - {@link markdownToXML}
 * - {@link markdownToCommonMark}
 * - {@link parseMarkdown}
 * - {@link renderHTML}
 * - {@link renderXML}
 * - {@link renderCommonMark}
 *
 * See the documentation for each individual option for detailed information on
 * their behavior and usage, as well as functional code examples.
 *
 * @category Options
 */
export interface Options {
  /** Configure extensions to the CommonMark specification. */
  extension?: ExtensionOptions;
  /** Configure parse-time options. */
  parse?: ParseOptions;
  /** Configure render-time options. */
  render?: RenderOptions;
  /** Configure {@linkcode Plugins} to customize Comrak's behavior. */
  plugins?: Plugins;
}

/**
 * Options to select extensions.
 *
 * @category Options
 * @tags extension
 */
export interface ExtensionOptions {
  /**
   * Enables the [autolink extension] from the GFM spec.
   *
   * [autolink extension]: https://github.github.com/gfm/#autolinks-extension-
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("Hello www.github.com.\n", {
   *   extension: { autolink: true },
   * });
   * assert.equal(html, '<p>Hello <a href="http://www.github.com">www.github.com</a>.</p>\n');
   * ```
   * @default {false}
   */
  autolink?: boolean;

  /**
   * Enables the description lists extension.
   *
   * Each term must be defined in one paragraph, followed by a blank line, and
   * then by the details. Details begins with a colon.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("Term\n\n: Definition", {
   *   extension: { descriptionLists: true },
   * });
   * assert.equal(html, "<dl>\n<dt>Term</dt>\n<dd>\n<p>Definition</p>\n</dd>\n</dl>\n");
   * ```
   * @default {false}
   */
  descriptionLists?: boolean;

  /**
   * Enables the footnotes extension per cmark-gfm.
   *
   * The extension is modelled after [Kramdown].
   *
   * [Kramdown]: https://kramdown.gettalong.org/syntax.html#footnotes
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("Hi[^x].\n\n[^x]: A greeting.\n", {
   *   extension: { footnotes: true },
   * });
   * assert.equal(html, "<p>Hi<sup class=\"footnote-ref\"><a href=\"#fn1\" id=\"fnref1\">1</a></sup>.</p>\n<section class=\"footnotes\">\n<ol>\n<li id=\"fn1\">\n<p>A greeting. <a href=\"#fnref1\" class=\"footnote-backref\">↩</a></p>\n</li>\n</ol>\n</section>\n");
   * ```
   * @default {false}
   */
  footnotes?: boolean;

  /**
   * Enables the inline footnotes extension.
   *
   * Allows inline footnote syntax `^[content]` where the content can include
   * inline markup. Inline footnotes are automatically converted to regular
   * footnotes with auto-generated names and share the same numbering sequence.
   *
   * Requires `footnotes` to be enabled as well.
   *
   * @example
   * ```ts
   * import { markdownToHTML, type Options } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const options: Options = {
   *   extension: {
   *     footnotes: false,
   *     inlineFootnotes: false,
   *   }
   * };
   *
   * const md = "Hi^[An inline note].\n";
   *
   * // Without inline footnotes
   * const htmlOff = markdownToHTML(md, options);
   * assert.equal(htmlOff, ""
   *
   * options.extension.footnotes = true;
   * options.extension.inlineFootnotes = true;
   * assert_eq!(markdown_to_html("Hi^[An inline note].\n", &options),
   *            "<p>Hi<sup class=\"footnote-ref\"><a href=\"#fn-__inline_1\" id=\"fnref-__inline_1\" data-footnote-ref>1</a></sup>.</p>\n<section class=\"footnotes\" data-footnotes>\n<ol>\n<li id=\"fn-__inline_1\">\n<p>An inline note <a href=\"#fnref-__inline_1\" class=\"footnote-backref\" data-footnote-backref data-footnote-backref-idx=\"1\" aria-label=\"Back to reference 1\">↩</a></p>\n</li>\n</ol>\n</section>\n");
   * ```
   */
  inlineFootnotes?: boolean;

  /**
   * Enables the front matter extension.
   *
   * Front matter, which begins with the delimiter string at the beginning of
   * the file and ends at the end of the next line that contains only the
   * delimiter, is passed through unchanged in markdown output and omitted
   * from HTML output.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("---\nlayout: post\n---\nText\n", {
   *   extension: { frontMatterDelimiter: "---" },
   * });
   * assert.equal(html, "<p>Text</p>\n");
   * ```
   * @default {null}
   */
  frontMatterDelimiter?: string | null;

  /**
   * Enables the header IDs Comrak extension.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("# README\n", {
   *   extension: { headerIDs: "user-content-" },
   * });
   * assert.equal(html, "<h1><a href=\"#readme\" aria-hidden=\"true\" class=\"anchor\" id=\"user-content-readme\"></a>README</h1>\n");
   * ```
   * @default {null}
   */
  headerIDs?: string | null;

  /**
   * Enables the [table extension] from the GFM spec.
   *
   * [table extension]: https://github.github.com/gfm/#tables-extension-
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("| a | b |\n|---|---|\n| c | d |\n", {
   *   extension: { table: true },
   * });
   * assert.equal(html, "<table>\n<thead>\n<tr>\n<th>a</th>\n<th>b</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>c</td>\n<td>d</td>\n</tr>\n</tbody>\n</table>\n");
   * ```
   * @default {false}
   */
  table?: boolean;

  /**
   * Enables the [tagfilter extension] per the GFM spec.
   *
   * [tagfilter extension]: https://github.github.com/gfm/#disallowed-raw-html-extension-
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("Hello <xmp>.\n\n<xmp>", {
   *   extension: { tagfilter: true },
   * });
   * assert.equal(html, "<p>Hello &lt;xmp>.</p>\n&lt;xmp>\n");
   * ```
   * @default {false}
   */
  tagfilter?: boolean;

  /**
   * Enables the [task list items extension] from the GFM spec.
   *
   * Note that the spec does not define the precise output, so only the bare
   * essentials are rendered.
   *
   * [task list items extension]: https://github.github.com/gfm/#task-list-items-extension-
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("* [x] Done\n* [ ] Not done\n", { extension: { tasklist: true } });
   * assert.equal(html, "<ul>\n<li><input type=\"checkbox\" disabled=\"\" checked=\"\" /> Done</li>\n<li><input type=\"checkbox\" disabled=\"\" /> Not done</li>\n</ul>\n");
   * ```
   * @default {false}
   */
  tasklist?: boolean;

  /**
   * Enables the multiline block quote extension.
   *
   * Place `>>>` before and after text to make it into a block quote.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML(">>>\nparagraph\n>>>", {
   *   extension: { multilineBlockQuotes: true },
   * });
   * assert.equal(html, "<blockquote>\n<p>paragraph</p>\n</blockquote>\n");
   * ```
   * @default {false}
   */
  multilineBlockQuotes?: boolean;

  /**
   * Enables GitHub-style alerts.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("> [!note]\n> Something of note", {
   *   extension: { alerts: true },
   * });
   * assert.equal(html, "<div class=\"markdown-alert markdown-alert-note\">\n<p class=\"markdown-alert-title\">Note</p>\n<p>Something of note</p>\n</div>\n");
   * ```
   *
   * @default {false}
   */
  alerts?: boolean;

  /**
   * Enables math using dollar syntax.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("$1 + 2$ and $$x = y$$", {
   *   extension: { mathDollars: true },
   * });
   * assert.equal(html, "<p><span data-math-style=\"inline\">1 + 2</span> and <span data-math-style=\"display\">x = y</span></p>\n");
   * ```
   * @default {false}
   */
  mathDollars?: boolean;

  /**
   * Enables math using code syntax.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("$`1 + 2`$", {
   *   extension: { mathCode: true },
   * });
   * assert.equal(html, "<p><code data-math-style=\"inline\">1 + 2</code></p>\n");
   * ```
   * @default {false}
   */
  mathCode?: boolean;

  /**
   * Enables wikilinks extension.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * // Title before pipe: [[title|url]]
   * const html = markdownToHTML("[[link label|url]]", {
   *   extension: { wikilinksTitleBeforePipe: true },
   * });
   * assert.equal(html, "<p><a href=\"url\" data-wikilink=\"true\">link label</a></p>\n");
   * ```
   * @default {false}
   */
  wikilinksTitleBeforePipe?: boolean;

  /**
   * Enables wikilinks extension.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * // Title after pipe: [[url|title]]
   * const html = markdownToHTML("[[url|link label]]", {
   *   extension: { wikilinksTitleAfterPipe: true },
   * });
   * assert.equal(html, "<p><a href=\"url\" data-wikilink=\"true\">link label</a></p>\n");
   * ```
   * @default {false}
   */
  wikilinksTitleAfterPipe?: boolean;

  /**
   * Enables underlines using double underscores.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("__underlined text__", {
   *   extension: { underline: true },
   * });
   * assert.equal(html, "<p><u>underlined text</u></p>\n");
   * ```
   * @default {false}
   */
  underline?: boolean;

  /**
   * Enables the [strikethrough extension] from the GFM spec.
   *
   * [strikethrough extension]: https://github.github.com/gfm/#strikethrough-extension-
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("Hello ~world~ there.\n", {
   *   extension: { strikethrough: true },
   * });
   * assert.equal(html, "<p>Hello <del>world</del> there.</p>\n");
   * ```
   * @default {false}
   */
  strikethrough?: boolean;

  /**
   * Enables the superscript Comrak extension.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("e = mc^2^.\n", { extension: { superscript: true } });
   * assert.equal(html, "<p>e = mc<sup>2</sup>.</p>\n");
   * ```
   * @default {false}
   */
  superscript?: boolean;

  /**
   * Enables subscript text using single tildes.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("H~2~O", {
   *   extension: { subscript: true },
   * });
   * assert.equal(html, "<p>H<sub>2</sub>O</p>\n");
   * ```
   * @default {false}
   */
  subscript?: boolean;

  /**
   * Enables spoilers using double vertical bars.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("Darth Vader is ||Luke's father||", {
   *   extension: { spoiler: true },
   * });
   * assert.equal(html, "<p>Darth Vader is <span class=\"spoiler\">Luke's father</span></p>\n");
   * ```
   * @default {false}
   */
  spoiler?: boolean;

  /**
   * Requires at least one space after a `>` character to generate a blockquote.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML(">implying implications", {
   *   extension: { greentext: true },
   * });
   * assert.equal(html, "<p>&gt;implying implications</p>\n");
   * ```
   * @default {false}
   */
  greentext?: boolean;

  /**
   * Phrases wrapped inside of ':' blocks will be replaced with emojis.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("Happy Friday! :smile:", {
   *   extension: { shortcodes: true },
   * });
   * assert.equal(html, "<p>Happy Friday! 😄</p>\n");
   * ```
   * @default {false}
   */
  shortcodes?: boolean;

  /**
   * Wraps image URLs using a custom {@linkcode URLRewriter}.
   *
   * @example
   * ```ts
   * import { markdownToHTML, Options } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const options = Options.default();
   * options.extension.imageURLRewriter = (url: string) =>
   *   `https://cdn.example.com/images/${encodeURIComponent(url)}`;
   *
   * const html = markdownToHTML("![alt text](image.png)", options);
   * assert.equal(html, '<p><img src="https://cdn.example.com/images/image.png" alt="alt text"></p>\n');
   * ```
   * @default {null}
   */
  imageURLRewriter?: URLRewriter | null;

  /**
   * Wraps link URLs using a function or custom trait object.
   *
   * @example
   * ```ts
   * import { markdownToHTML, Options } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const options = Options.default();
   * options.extension.linkURLRewriter = (url: string) =>
   *   `https://safe.example.com/norefer?url=${encodeURIComponent(url)}`;
   *
   * const html = markdownToHTML("[my link](http://unsafe.example.com/bad)", options);
   * assert.equal(html,
   *   '<p><a href="https://safe.example.com/norefer?url=http%3A%2F%2Funsafe.example.com%2Fbad">my link</a></p>\n'
   * );
   * ```
   * @default {null}
   */
  linkURLRewriter?: URLRewriter | null;

  /**
   * Recognizes many emphasis that appear in CJK contexts.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("**この文は重要です。**但这句话并不重要。", {
   *   extension: { cjkFriendlyEmphasis: true },
   * });
   * assert.equal(html, "<p><strong>この文は重要です。</strong>但这句话并不重要。</p>\n");
   * ```
   * @default {false}
   */
  cjkFriendlyEmphasis?: boolean;

  // TODO: add missing extensions from comrak::options::ExtensionOptions here
}

/**
 * Options for parser functions.
 *
 * @category Options
 * @tags parse
 */
export interface ParseOptions {
  /**
   * The default info string for fenced code blocks.
   *
   * @example
   * ````ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * let html = markdownToHTML("```\nfn hello();\n```\n");
   * assert.equal(html, "<pre><code>fn hello();\n</code></pre>\n");
   *
   * html = markdownToHTML("```\nfn hello();\n```\n", {
   *   parse: { defaultInfoString: "rust" },
   * });
   * assert.equal(html, "<pre><code class=\"language-rust\">fn hello();\n</code></pre>\n");
   * ````
   * @default {null}
   */
  defaultInfoString?: string | null;

  /**
   * When enabled, converts all quotes, full-stops, hyphens, ellipsis, and
   * other punctuation into their ‘smart’ equivalents. Also commonly known as
   * "smartypants" conversion.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * let html = markdownToHTML("'Hello,' \"world\" ...");
   * assert.equal(html, "<p>'Hello,' &quot;world&quot; ...</p>\n");
   *
   * html = markdownToHTML("'Hello,' \"world\" ...", {
   *   parse: { smart: true },
   * });
   * assert.equal(html, "<p>‘Hello,’ “world” …</p>\n");
   * ```
   *
   * @default {false}
   */
  smart?: boolean;

  /**
   * Whether or not a simple `x` or `X` is used for tasklist or any other
   * symbol is allowed.
   *
   * @default {false}
   */
  relaxedTasklistMatching?: boolean;

  /**
   * Relax parsing of autolinks, allow links to be detected inside brackets
   * and allow all url schemes.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("[https://foo.com]", {
   *   extension: { autolink: true },
   *   parse: { relaxedAutolinks: true },
   * });
   * assert.equal(html, "<p>[<a href=\"https://foo.com\">https://foo.com</a>]</p>\n");
   * ```
   * @default {false}
   */
  relaxedAutolinks?: boolean;

  /**
   * Ignore setext headings in input.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("setext heading\n---", {
   *   parse: { ignoreSetext: true },
   * });
   * assert.equal(html, "<p>setext heading</p>\n<hr />\n");
   * ```
   * @default {false}
   */
  ignoreSetext?: boolean;

  /**
   * Callback for broken link resolution. When the parser encounters a link or
   * image reference that does not have a corresponding definition, this option
   * determines how to handle it.
   *
   * You can specify the callback either as a function, or an object that
   * implements the {@linkcode BrokenLinkCallbackImpl} interface.
   *
   * In either case, the callback will be invoked with a
   * {@linkcode BrokenLinkReference} object containing the normalized and
   * original URLs of the broken link. The callback should return a
   * {@linkcode ResolvedReference} object, which contains a `url` and `title`
   * to replace the broken link with, or `null` or `undefined` to leave the
   * link unchanged.
   *
   * @example
   * ```ts
   * import { markdownToHTML, Options } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const options = Options.default();
   *
   * options.parse.brokenLinkCallback = (ref) => {
   *   if (ref.normalized.includes("badge")) {
   *     return {
   *       url: "https://img.shields.io/badge/placeholder-lightgrey.svg",
   *       title: `Placeholder Badge (original: ${ref.original})`,
   *     };
   *   }
   *   return null;
   * };
   *
   * const html = markdownToHTML("![Build Status][undefined-badge]\n", options);
   * assert.equal(html, '<p><img src="https://img.shields.io/badge/placeholder-lightgrey.svg" alt="Build Status" title="Placeholder Badge (original: undefined-badge)" /></p>\n');
   * ```
   * @default {null}
   */
  brokenLinkCallback?: BrokenLinkCallback | null;

  /**
   * Leave footnote definitions in place in the document tree, rather than
   * reordering them to the end.  This will also cause unreferenced footnote
   * definitions to remain in the tree, rather than being removed.
   *
   * Comrak's default formatters expect this option to be turned **off**, so
   * use this with care if you use the default formatters.
   *
   * @default {false}
   */
  // TODO: add example with AST manipulation
  leaveFootnoteDefinitions?: boolean;

  /**
   * Leave escaped characters in an `Escaped` node in the document tree.
   *
   * **Note**: enabling the {@linkcode RenderOptions.escapedCharSpans} will
   * cause this option to be enabled automatically.
   *
   * @default {false}
   */
  escapedCharSpans?: boolean;
}

/**
 * Options for the renderer functions.
 *
 * @category Options
 * @tags render
 */
export interface RenderOptions {
  /**
   * Escape raw HTML instead of clobbering it.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * let html = markdownToHTML("<i>italic text</i>");
   * assert.equal(html, "<p><!-- raw HTML omitted -->italic text<!-- raw HTML omitted --></p>\n");
   *
   * html = markdownToHTML("<i>italic text</i>", {
   *   render: { escape: true },
   * });
   * assert.equal(html, "<p>&lt;i&gt;italic text&lt;/i&gt;</p>\n");
   * ```
   * @default {false}
   */
  escape?: boolean;

  /**
   * GitHub-style `<pre lang="xyz">` is used for fenced code blocks with info
   * tags, instead of `<pre><code class="language-xyz">`.
   *
   * @example
   * ````ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * let html = markdownToHTML("```rust\nfn hello();\n```\n");
   * assert.equal(html, "<pre><code class=\"language-rust\">fn hello();\n</code></pre>\n");
   *
   * html = markdownToHTML("```rust\nfn hello();\n```\n", {
   *   render: { githubPreLang: true },
   * });
   * assert.equal(html, "<pre lang=\"rust\"><code>fn hello();\n</code></pre>\n");
   * ````
   * @default {false}
   */
  githubPreLang?: boolean;

  /**
   * [Soft line breaks](https://spec.commonmark.org/0.27/#soft-line-breaks) in
   * the input translate into hard line breaks in the output.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * let html = markdownToHTML("Hello.\nWorld.\n");
   * assert.equal(html, "<p>Hello.\nWorld.</p>\n");
   *
   * html = markdownToHTML("Hello.\nWorld.\n", { render: { hardbreaks: true } });
   * assert.equal(html, "<p>Hello.<br />\nWorld.</p>\n");
   * ```
   * @default {false}
   */
  hardbreaks?: boolean;

  /**
   * Allow rendering of raw HTML and potentially dangerous links.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const safeHTML = markdownToHTML("<script>\nalert('xyz');\n</script>\n\n\
   *                 Possibly <marquee>annoying</marquee>.\n\n\
   *                 [Dangerous](javascript:alert(document.cookie)).\n\n\
   *                 [Safe](http://commonmark.org).\n");
   * assert.equal(safeHTML, "<!-- raw HTML omitted -->\n\
   *   <p>Possibly <!-- raw HTML omitted -->annoying<!-- raw HTML omitted -->.</p>\n\
   *   <p><a href=\"\">Dangerous</a>.</p>\n\
   *   <p><a href=\"http://commonmark.org\">Safe</a>.</p>\n");
   *
   * const unsafeHTML = markdownToHTML(
   *   "<script>\nalert('xyz');\n</script>\n\n\
   *   Possibly <marquee>annoying</marquee>.\n\n\
   *   [Dangerous](javascript:alert(document.cookie)).\n\n\
   *   [Safe](http://commonmark.org).\n",
   *   { render: { unsafe: true } },
   * );
   * assert.equal(unsafeHTML, "<script>\nalert(\'xyz\');\n</script>\n\
   *   <p>Possibly <marquee>annoying</marquee>.</p>\n\
   *   <p><a href=\"javascript:alert(document.cookie)\">Dangerous</a>.</p>\n\
   *   <p><a href=\"http://commonmark.org\">Safe</a>.</p>\n");
   * ```
   * @default {false}
   */
  unsafe?: boolean;

  /**
   * The wrap column when outputting CommonMark.
   *
   * @default {0}
   */
  width?: number;

  /**
   * Whether to use the full info string for fenced code blocks.
   *
   * @example
   * ````ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * let html = markdownToHTML("```rust extra info\nfn hello();\n```\n");
   * assert.equal(html, '<pre><code class="language-rust">fn hello();\n</code></pre>\n');
   *
   * html = markdownToHTML("```rust extra info\nfn hello();\n```\n", {
   *   render: { fullInfoString: true },
   * });
   * assert.equal(html, '<pre><code class="language-rust" data-meta="extra info">fn hello();\n</code></pre>\n');
   * ````
   *
   * @default {false}
   */
  fullInfoString?: boolean;

  /**
   * The style for list items.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("* Item\n* Item\n", { render: { listStyle: "star" } });
   * assert.equal(html, "<ul>\n<li>Item</li>\n<li>Item</li>\n</ul>\n");
   * ```
   * @default {"dash"}
   */
  listStyle?: "dash" | "plus" | "star";

  /**
   * Include source position attributes in HTML and XML output.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("Hello *world*!", {
   *   render: { sourcepos: true },
   * });
   * assert.equal(html, "<p data-sourcepos=\"1:1-1:14\">Hello <em data-sourcepos=\"1:7-1:13\">world</em>!</p>\n");
   * ```
   *
   * @default {false}
   */
  sourcepos?: boolean;

  /**
   * Wrap escaped characters in a `<span>` to allow any post-processing to recognize them.
   *
   * **Note**: enabling this will also enable {@linkcode ParseOptions.escapedCharSpans}.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("Notify user \\@example", {
   *   render: { escapedCharSpans: true },
   * });
   * assert.equal(html, "<p>Notify user <span data-escaped-char>@</span>example</p>\n");
   * ```
   * @default {false}
   */
  escapedCharSpans?: boolean;

  /**
   * Ignore empty links in input.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("[]()", {
   *   render: { ignoreEmptyLinks: true },
   * });
   * assert.equal(html, "<p>[]()</p>\n");
   * ```
   * @default {false}
   */
  ignoreEmptyLinks?: boolean;

  /**
   * Enables GFM quirks in HTML output which break CommonMark compatibility.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("****abcd****", {
   *   render: { gfmQuirks: true },
   * });
   * assert.equal(html, "<p><strong>abcd</strong></p>\n");
   * ```
   * @default {false}
   */
  gfmQuirks?: boolean;

  /**
   * Prefer fenced code blocks when outputting CommonMark.
   *
   * @default {false}
   */
  preferFenced?: boolean;

  /**
   * Render the image as a figure element with the title as its caption.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("![image](https://example.com/image.png \"this is an image\")", { render: { figureWithCaption: true } });
   * assert.equal(html, "<p><figure><img src=\"https://example.com/image.png\" alt=\"image\" title=\"this is an image\" /><figcaption>this is an image</figcaption></figure></p>\n");
   * ```
   * @default {false}
   */
  figureWithCaption?: boolean;

  /**
   * Add classes to the output of the tasklist extension.
   *
   * @example
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   * import assert from "node:assert";
   *
   * const html = markdownToHTML("- [ ] Foo", {
   *   extension: { tasklist: true },
   *   render: { tasklistClasses: true },
   * });
   * assert.equal(html, "<ul class=\"contains-task-list\">\n<li class=\"task-list-item\"><input type=\"checkbox\" class=\"task-list-item-checkbox\" disabled=\"\" /> Foo</li>\n</ul>\n");
   * ```
   * @default {false}
   */
  tasklistClasses?: boolean;

  /**
   * Render ordered list with a minimum marker width.
   *
   * @default {0}
   */
  olWidth?: number;

  /**
   * Minimise escapes used in CommonMark output.
   *
   * @default {false}
   */
  experimentalMinimizeCommonmark?: boolean;
}

/**
 * Plugins to customize rendering behavior.
 *
 * @category Options
 * @tags render, plugins
 */
export interface RenderPlugins {
  /** Adapter for syntax highlighting codefences. */
  codefenceSyntaxHighlighter?: SyntaxHighlighterAdapter | null;
  /** Adapter for customizing heading rendering. */
  headingAdapter?: HeadingAdapter | null;
}

/**
 * Plugins to customize rendering behavior.
 *
 * @category Options
 * @tags plugins
 */
export interface Plugins {
  /**
   * Plugins to customize rendering behavior.
   */
  render?: RenderPlugins;
}

/**
 * Default options for the various parsing, rendering, and conversion functions
 * in the Comrak library.
 *
 * @category Options
 */
export const defaultOptions: DefaultOptions = {
  extension: {
    autolink: false,
    descriptionLists: false,
    footnotes: false,
    inlineFootnotes: false,
    frontMatterDelimiter: null,
    headerIDs: null,
    strikethrough: false,
    superscript: false,
    table: false,
    tagfilter: false,
    tasklist: false,
    multilineBlockQuotes: false,
    alerts: false,
    mathDollars: false,
    mathCode: false,
    wikilinksTitleBeforePipe: false,
    wikilinksTitleAfterPipe: false,
    underline: false,
    subscript: false,
    spoiler: false,
    shortcodes: false,
    greentext: false,
    cjkFriendlyEmphasis: false,
    linkURLRewriter: null,
    imageURLRewriter: null,
  },
  parse: {
    defaultInfoString: null,
    smart: false,
    relaxedTasklistMatching: false,
    relaxedAutolinks: false,
    ignoreSetext: false,
    brokenLinkCallback: null,
    leaveFootnoteDefinitions: false,
    escapedCharSpans: false,
  },
  render: {
    escape: false,
    githubPreLang: false,
    hardbreaks: false,
    unsafe: false,
    width: 0,
    fullInfoString: false,
    listStyle: "dash",
    sourcepos: false,
    escapedCharSpans: false,
    ignoreEmptyLinks: false,
    gfmQuirks: false,
    preferFenced: false,
    figureWithCaption: false,
    tasklistClasses: false,
    olWidth: 0,
    experimentalMinimizeCommonmark: false,
  },
  plugins: {
    render: {
      codefenceSyntaxHighlighter: null,
      headingAdapter: null,
    },
  },
};

/**
 * Default options with all fields specified.
 *
 * @category Options
 * @tags defaults
 */
export type DefaultOptions = RequiredDeep<
  Options,
  URLRewriter | HeadingAdapter | SyntaxHighlighterAdapter
>;

/**
 * Options with defaults applied, and a `default` method to obtain a fresh copy
 * of the default options object, for use when constructing new options.
 *
 * @category Options
 * @tags defaults
 */
export interface OptionsWithDefaults extends DefaultOptions {
  /**
   * Returns a fresh copy of the {@linkcode defaultOptions} object,
   * as a deeply-cloned (immutable) copy of the original.
   */
  default(): DefaultOptions;
}

/**
 * The `Options` object contains the default options for Comrak, as well as a
 * `default` helper method to obtain a fresh copy of those defaults.
 *
 * This is useful when constructing new options objects to pass to Comrak's
 * parsing, rendering, and conversion functions, as it ensures that all fields
 * are set and avoids any issues with mutation-related side-effects.
 *
 * @category Options
 * @tags defaults
 */
export const Options: OptionsWithDefaults = {
  __proto__: defaultOptions,
  default: () => cloneDeep(defaultOptions),
} as unknown as OptionsWithDefaults;
