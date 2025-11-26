// @generated file from wasmbuild -- do not edit
// deno-lint-ignore-file
// deno-fmt-ignore-file

export function default_options(): object;
/**
 * r" Render Markdown to CommonMark.
 * r" See the documentation of the crate root for an example.
 */
export function markdown_to_commonmark(
  md: string,
  options: Option<Options>,
  codefence_syntax_highlighter: Option<SyntaxHighlighterAdapter>,
  heading_adapter: Option<HeadingAdapter>,
  broken_link_callback: Option<BrokenLinkCallbackFunction>,
  image_url_rewriter: Option<URLRewriterFunction>,
  link_url_rewriter: Option<URLRewriterFunction>,
): string;
/**
 * Returns the version of Comrak used in this build, as a string.
 */
export function version(): string;
export function default_render_options(): object;
/**
 * r" Format an AST to XML using plugins.
 * r"
 * r" See the documentation of the crate root for an example.
 */
export function format_xml(
  ast: AST,
  options: Option<Options>,
  codefence_syntax_highlighter: Option<SyntaxHighlighterAdapter>,
  heading_adapter: Option<HeadingAdapter>,
  broken_link_callback: Option<BrokenLinkCallbackFunction>,
  image_url_rewriter: Option<URLRewriterFunction>,
  link_url_rewriter: Option<URLRewriterFunction>,
): string;
/**
 * r" Render Markdown to HTML using plugins.
 * r" See the documentation of the crate root for an example.
 */
export function markdown_to_html(
  md: string,
  options: Option<Options>,
  codefence_syntax_highlighter: Option<SyntaxHighlighterAdapter>,
  heading_adapter: Option<HeadingAdapter>,
  broken_link_callback: Option<BrokenLinkCallbackFunction>,
  image_url_rewriter: Option<URLRewriterFunction>,
  link_url_rewriter: Option<URLRewriterFunction>,
): string;
/**
 * r" Format an AST to HTML using plugins.
 * r"
 * r" See the documentation of the crate root for an example.
 */
export function format_html(
  ast: AST,
  options: Option<Options>,
  codefence_syntax_highlighter: Option<SyntaxHighlighterAdapter>,
  heading_adapter: Option<HeadingAdapter>,
  broken_link_callback: Option<BrokenLinkCallbackFunction>,
  image_url_rewriter: Option<URLRewriterFunction>,
  link_url_rewriter: Option<URLRewriterFunction>,
): string;
/**
 * r" Format an AST to CommonMark using plugins.
 * r"
 * r" See the documentation of the crate root for an example.
 */
export function format_commonmark(
  ast: AST,
  options: Option<Options>,
  codefence_syntax_highlighter: Option<SyntaxHighlighterAdapter>,
  heading_adapter: Option<HeadingAdapter>,
  broken_link_callback: Option<BrokenLinkCallbackFunction>,
  image_url_rewriter: Option<URLRewriterFunction>,
  link_url_rewriter: Option<URLRewriterFunction>,
): string;
/**
 * Parses the given markdown text and returns the AST as a structured object.
 */
export function parse_document(
  md: string,
  options: Option<Options>,
  broken_link_callback: Option<BrokenLinkCallbackFunction>,
  image_url_rewriter: Option<URLRewriterFunction>,
  link_url_rewriter: Option<URLRewriterFunction>,
): AST;
/**
 * r" Render Markdown to XML using plugins.
 * r"
 * r" See the documentation of the crate root for an example.
 */
export function markdown_to_xml(
  md: string,
  options: Option<Options>,
  codefence_syntax_highlighter: Option<SyntaxHighlighterAdapter>,
  heading_adapter: Option<HeadingAdapter>,
  broken_link_callback: Option<BrokenLinkCallbackFunction>,
  image_url_rewriter: Option<URLRewriterFunction>,
  link_url_rewriter: Option<URLRewriterFunction>,
): string;
export function default_extension_options(): object;
export function default_parse_options(): object;

import type {
  BrokenLinkCallbackFunction,
  BrokenLinkReference,
  ExtensionOptions,
  Options,
  ParseOptions,
  RenderOptions,
  ResolvedReference,
  URLRewriterFunction,
} from "../options.ts";
import type { AST, Sourcepos } from "../nodes.ts";
import type { HeadingMeta } from "../adapters.ts";

/**
 * An optional type that can either be of type `T`, or `null` or `undefined`.
 *
 * This is primarily used to represent optional parameters in functions
 * exposed to JavaScript via WebAssembly bindings. It is intended to mirror the
 * `Option<T>` type in Rust, while being idiomatic to TypeScript/JavaScript.
 *
 * @internal
 */
export type Option<T> = T | null | undefined;

/**
 * The `BrokenLinkCallback` API allows you to handle broken links found by
 * Comrak while parsing a Markdown document. You can leverage this API via the
 * {@linkcode Options.parse.brokenLinkCallback} option.
 * It exposes its inner `resolve` function as well as a `call` method to
 * invoke it directly, which is rarely used outside of testing and other
 * advanced use cases. The `call` signature mirrors that of the native
 * `Function.prototype.call` method in JavaScript, accepting a custom `this`
 * binding for its first argument, followed by the broken link reference.
 */
export class BrokenLinkCallback {
  free(): void;
  constructor(resolve: BrokenLinkCallbackFunction);
  call(thisArg: any, reference: BrokenLinkReference): Option<ResolvedReference>;
  get resolve(): BrokenLinkCallbackFunction;
  set resolve(value: Function);
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
 * # Methods
 *
 * ## `enter`
 *
 * The `enter` method is called **once** for each heading immediately before
 * rendering its content, and as such, should render the opening tag and any
 * attributes it has.
 *
 * ## `exit`
 *
 * The `exit` method - also called **once** - is invoked immediately _after_
 * the heading content has been rendered, and should render the closing tag.
 */
export class HeadingAdapter {
  free(): void;
  constructor(
    enter: (
      this: HeadingMeta,
      heading: HeadingMeta,
      sourcepos?: Sourcepos,
    ) => string,
    exit: (this: HeadingMeta, heading: HeadingMeta) => string,
  );
}
/**
 * The `SyntaxHighlighterAdapter` API allows you to customize how code blocks
 * are highlighted by Comrak, by specifying three custom rendering methods:
 *
 * 1. `highlight(code: string, lang?: string | null): string` - highlights
 *    the code block content based on the specified language tag (if any),
 *    returning the highlighted HTML string.
 * 2. `pre(attrs: Record<string, string>): string` - renders the opening
 *    `<pre>` tag with the provided attributes, returning the HTML string.
 * 3. `code(attrs: Record<string, string>): string` - renders the opening
 *    `<code>` tag with the provided attributes, returning the HTML string.
 */
export class SyntaxHighlighterAdapter {
  free(): void;
  constructor(
    highlight: (code: string, lang?: string | null) => string,
    pre: (attrs: Record<string, string>) => string,
    code: (attrs: Record<string, string>) => string,
  );
}
/**
 * The `URLRewriter` API allows you to rewrite the URLs of links and images
 * being converted from Markdown to HTML by Comrak. You can leverage this API
 * via the option {@linkcode ExtensionOptions.linkURLRewriter} (for links) or
 * {@linkcode ExtensionOptions.imageURLRewriter} (for images).
 *
 * The `call` signature mirrors that of the native `Function.prototype.call`
 * method in JavaScript, accepting a custom `this` binding for its first
 * argument, followed by the URL string to rewrite.
 */
export class URLRewriter {
  free(): void;
  constructor(rewriter: URLRewriterFunction);
  call(thisArg: any, url: string): string;
  get rewriter(): URLRewriterFunction;
  set rewriter(value: Function);
}
