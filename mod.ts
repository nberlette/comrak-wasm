// @ts-types="./lib/comrak_wasm.d.ts"
import { markdown_to_html } from "./lib/comrak_wasm.js";

/**
 * Options for the {@linkcode markdownToHTML} function.
 */
export interface ComrakOptions {
  /** Enable CommonMark extensions. */
  extension?: ComrakExtensionOptions;
  /** Configure parse-time options. */
  parse?: ComrakParseOptions;
  /** Configure render-time options. */
  render?: ComrakRenderOptions;
}

/** Options to select extensions. */
export interface ComrakExtensionOptions {
  /** Enables the
   * [autolink extension](https://github.github.com/gfm/#autolinks-extension-)
   * from the GFM spec.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("Hello www.github.com.\n", { extension: { autolink: true } });
   * // "<p>Hello <a href=\"http://www.github.com\">www.github.com</a>.</p>\n"
   * ```
   *
   * Defaults to `false`.
   */
  autolink?: boolean;

  /** Enables the description lists extension.
   *
   * Each term must be defined in one paragraph, followed by a blank line, and
   * then by the details. Details begins with a colon.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("Term\n\n: Definition", { extension: { descriptionLists: true } });
   * // "<dl><dt>Term</dt>\n<dd>\n<p>Definition</p>\n</dd>\n</dl>\n"
   * ```
   *
   * Defaults to `false`.
   */

  descriptionLists?: boolean;

  /** Enables the footnotes extension per cmark-gfm.
   *
   * The extension is modelled after
   * [Kramdown](https://kramdown.gettalong.org/syntax.html#footnotes).
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("Hi[^x].\n\n[^x]: A greeting.\n", { extension: { footnotes: true } });
   * // "<p>Hi<sup class=\"footnote-ref\"><a href=\"#fn1\" id=\"fnref1\">1</a></sup>.</p>\n<section class=\"footnotes\">\n<ol>\n<li id=\"fn1\">\n<p>A greeting. <a href=\"#fnref1\" class=\"footnote-backref\">↩</a></p>\n</li>\n</ol>\n</section>\n"
   * ```
   *
   * Defaults to `false`.
   */
  footnotes?: boolean;

  /** Enables the front matter extension.
   *
   * Front matter, which begins with the delimiter string at the beginning of
   * the file and ends at the end of the next line that contains only the
   * delimiter, is passed through unchanged in markdown output and omitted
   * from HTML output.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("---\nlayout: post\n---\nText\n", { extension: { frontMatterDelimiter: "---" } });
   * // "<p>Text</p>\n"
   * ```
   *
   * Defaults to `null`.
   */
  frontMatterDelimiter?: string | null;

  /** Enables the header IDs Comrak extension.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("# README\n", { extension: { headerIDs: "user-content-" } });
   * // "<h1><a href=\"#readme\" aria-hidden=\"true\" class=\"anchor\" id=\"user-content-readme\"></a>README</h1>\n"
   * ```
   *
   * Defaults to `null`.
   */
  headerIDs?: string | null;

  /** Enables the
   * [strikethrough extension](https://github.github.com/gfm/#strikethrough-extension-)
   * from the GFM spec.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("Hello ~world~ there.\n", { extension: { strikethrough: true } });
   * // "<p>Hello <del>world</del> there.</p>\n"
   * ```
   *
   * Defaults to `false`.
   */
  strikethrough?: boolean;

  /** Enables the superscript Comrak extension.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("e = mc^2^.\n", { extension: { superscript: true } });
   * // "<p>e = mc<sup>2</sup>.</p>\n"
   * ```
   *
   * Defaults to `false`.
   */
  superscript?: boolean;

  /** Enables the
   * [table extension](https://github.github.com/gfm/#tables-extension-)
   * from the GFM spec.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("| a | b |\n|---|---|\n| c | d |\n", { extension: { table: true } });
   * // "<table>\n<thead>\n<tr>\n<th>a</th>\n<th>b</th>\n</tr>\n</thead>\n" +
   * // "<tbody>\n<tr>\n<td>c</td>\n<td>d</td>\n</tr>\n</tbody>\n</table>\n"
   * ```
   *
   * Defaults to `false`.
   */
  table?: boolean;

  /** Enables the
   * [tagfilter extension](https://github.github.com/gfm/#disallowed-raw-html-extension-)
   * from the GFM spec.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("Hello <xmp>.\n\n<xmp>", { extension: { tagfilter: true } });
   * // "<p>Hello &lt;xmp>.</p>\n&lt;xmp>\n"
   * ```
   *
   * Defaults to `false`.
   */
  tagfilter?: boolean;

  /** Enables the
   * [task list items extension](https://github.github.com/gfm/#task-list-items-extension-)
   * from the GFM spec.
   *
   * Note that the spec does not define the precise output, so only the bare essentials are rendered.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("* [x] Done\n* [ ] Not done\n", { extension: { tasklist: true } });
   * // "<ul>\n<li><input type=\"checkbox\" disabled=\"\" checked=\"\" /> Done</li>\n\
   * // <li><input type=\"checkbox\" disabled=\"\" /> Not done</li>\n</ul>\n"
   * ```
   *
   * Defaults to `false`.
   */
  tasklist?: boolean;
}

/** Options for parser functions. */
export interface ComrakParseOptions {
  /**
   * The default info string for fenced code blocks.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("\`\`\`\nfn hello();\n\`\`\`\n");
   * // "<pre><code>fn hello();\n</code></pre>\n"
   *
   * markdownToHTML("\`\`\`\nfn hello();\n\`\`\`\n", { parse: { defaultInfoString: "rust" } });
   * // "<pre><code class=\"language-rust\">fn hello();\n</code></pre>\n"
   * ```
   *
   * Defaults to `null`.
   */
  defaultInfoString?: string | null;

  /** Punctuation (quotes, full-stops and hyphens) are converted into ‘smart’
   * punctuation.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("'Hello,' \"world\" ...");
   * // "<p>'Hello,' &quot;world&quot; ...</p>\n"
   *
   * markdownToHTML("'Hello,' \"world\" ...", { parse: { smart: true } });
   * // "<p>‘Hello,’ “world” …</p>\n"
   * ```
   *
   * Defaults to `false`.
   */
  smart?: boolean;
}

/**
 * Options for formatter functions.
 */
export interface ComrakRenderOptions {
  /** Escape raw HTML instead of clobbering it.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("<i>italic text</i>");
   * // "<p><!-- raw HTML omitted -->italic text<!-- raw HTML omitted --></p>\n"
   *
   * markdownToHTML("<i>italic text</i>", { render: { escape: true } });
   * // "<p>&lt;i&gt;italic text&lt;/i&gt;</p>\n"
   * ```
   *
   * Defaults to `false`.
   */
  escape?: boolean;

  /** GitHub-style `<pre lang="xyz">` is used for fenced code blocks with info
   * tags.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("\`\`\`rust\nfn hello();\n\`\`\`\n");
   * // "<pre><code class=\"language-rust\">fn hello();\n</code></pre>\n"
   *
   * markdownToHTML("\`\`\`rust\nfn hello();\n\`\`\`\n", { render: { githubPreLang: true } });
   * // "<pre lang=\"rust\"><code>fn hello();\n</code></pre>\n"
   * ```
   *
   * Defaults to `false`.
   */
  githubPreLang?: boolean;

  /** [Soft line breaks](https://spec.commonmark.org/0.27/#soft-line-breaks) in
   * the input translate into hard line breaks in the output.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("Hello.\nWorld.\n");
   * // "<p>Hello.\nWorld.</p>\n"
   *
   * markdownToHTML("Hello.\nWorld.\n", { render: { hardbreaks: true } });
   * // "<p>Hello.<br />\nWorld.</p>\n"
   * ```
   *
   * Defaults to `false`.
   */
  hardbreaks?: boolean;

  /** Allow rendering of raw HTML and potentially dangerous links.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("<script>\nalert('xyz');\n</script>\n\n\
   *                 Possibly <marquee>annoying</marquee>.\n\n\
   *                 [Dangerous](javascript:alert(document.cookie)).\n\n\
   *                 [Safe](http://commonmark.org).\n");
   * // "<!-- raw HTML omitted -->\n\
   * // <p>Possibly <!-- raw HTML omitted -->annoying<!-- raw HTML omitted -->.</p>\n\
   * // <p><a href=\"\">Dangerous</a>.</p>\n\
   * // <p><a href=\"http://commonmark.org\">Safe</a>.</p>\n"
   *
   * markdownToHTML("<script>\nalert('xyz');\n</script>\n\n\
   *                 Possibly <marquee>annoying</marquee>.\n\n\
   *                 [Dangerous](javascript:alert(document.cookie)).\n\n\
   *                 [Safe](http://commonmark.org).\n",
   *                { render: { unsafe: true } });
   * // "<script>\nalert(\'xyz\');\n</script>\n\
   * // <p>Possibly <marquee>annoying</marquee>.</p>\n\
   * // <p><a href=\"javascript:alert(document.cookie)\">Dangerous</a>.</p>\n\
   * // <p><a href=\"http://commonmark.org\">Safe</a>.</p>\n"
   * ```
   *
   * Defaults to `false`.
   */
  unsafe?: boolean;

  /**
   * The wrap column when outputting CommonMark.
   *
   * Defaults to `0`.
   */
  width?: number;
}

/**
 * Render Markdown to HTML.
 *
 * @param markdown The Markdown string to be converted.
 * @param [options] Options to customize the conversion.
 * @returns The generated HTML string.
 * @example
 * ```ts
 * import { markdownToHTML } from "@nick/comrak";
 *
 * markdownToHTML("Hello, **Nick**!");
 * // "<p>Hello, <strong>Nick</strong>!</p>\n"
 * ```
 */
export function markdownToHTML(
  markdown: string,
  options: ComrakOptions = {},
): string {
  const { extension = {}, parse = {}, render = {} } = options;

  const opts = {
    extension_autolink: extension.autolink ?? false,
    extension_description_lists: extension.descriptionLists ?? false,
    extension_footnotes: extension.footnotes ?? false,
    extension_front_matter_delimiter: extension.frontMatterDelimiter ?? "---",
    extension_header_ids: extension.headerIDs ?? "",
    extension_strikethrough: extension.strikethrough ?? false,
    extension_superscript: extension.superscript ?? false,
    extension_table: extension.table ?? false,
    extension_tagfilter: extension.tagfilter ?? false,
    extension_tasklist: extension.tasklist ?? false,
    parse_default_into_string: parse.defaultInfoString ?? "",
    parse_smart: parse.smart ?? false,
    render_escape: render.escape ?? false,
    render_github_pre_lang: render.githubPreLang ?? false,
    render_hardbreaks: render.hardbreaks ?? false,
    render_unsafe: render.unsafe ?? false,
    render_width: render.width ?? 0,
  };
  return markdown_to_html(markdown, opts);
}
