// @ts-types="./lib/comrak_wasm.d.ts"
import { markdown_to_html, type Options } from "./lib/comrak_wasm.js";

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
   * @default {false}
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
   * @default {false}
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
   * @default {false}
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
   * @default {null}
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
   * @default {null}
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
   * @default {false}
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
   * @default {false}
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
   * @default {false}
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
   * @default {false}
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
   * @default {false}
   */
  tasklist?: boolean;

  /** Enables the multiline block quote extension.
   *
   * Place `>>>` before and after text to make it into a block quote.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML(">>>\nparagraph\n>>>", { extension: { multilineBlockQuotes: true } });
   * // "<blockquote>\n<p>paragraph</p>\n</blockquote>\n"
   * ```
   *
   * @default {false}
   */
  multilineBlockQuotes?: boolean;

  /** Enables GitHub style alerts.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("> [!note]\n> Something of note", { extension: { alerts: true } });
   * // "<div class=\"markdown-alert markdown-alert-note\">\n<p class=\"markdown-alert-title\">Note</p>\n<p>Something of note</p>\n</div>\n"
   * ```
   *
   * @default {false}
   */
  alerts?: boolean;

  /** Enables math using dollar syntax.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("$1 + 2$ and $$x = y$$", { extension: { mathDollars: true } });
   * // "<p><span data-math-style=\"inline\">1 + 2</span> and <span data-math-style=\"display\">x = y</span></p>\n"
   * ```
   *
   * @default {false}
   */
  mathDollars?: boolean;

  /** Enables math using code syntax.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("$`1 + 2`$", { extension: { mathCode: true } });
   * // "<p><code data-math-style=\"inline\">1 + 2</code></p>\n"
   * ```
   *
   * @default {false}
   */
  mathCode?: boolean;

  /** Enables wikilinks using title after pipe syntax.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("[[url|link label]]", { extension: { wikiLinksTitleAfterPipe: true } });
   * // "<p><a href=\"url\" data-wikilink=\"true\">link label</a></p>\n"
   * ```
   *
   * @default {false}
   */
  wikiLinksTitleAfterPipe?: boolean;

  /** Enables wikilinks using title before pipe syntax.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("[[link label|url]]", { extension: { wikiLinksTitleBeforePipe: true } });
   * // "<p><a href=\"url\" data-wikilink=\"true\">link label</a></p>\n"
   * ```
   *
   * @default {false}
   */
  wikiLinksTitleBeforePipe?: boolean;

  /** Enables underlines using double underscores.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("__underlined text__", { extension: { underline: true } });
   * // "<p><u>underlined text</u></p>\n"
   * ```
   *
   * @default {false}
   */
  underline?: boolean;

  /** Enables subscript text using single tildes.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("H~2~O", { extension: { subscript: true } });
   * // "<p>H<sub>2</sub>O</p>\n"
   * ```
   *
   * @default {false}
   */
  subscript?: boolean;

  /** Enables spoilers using double vertical bars.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("Darth Vader is ||Luke's father||", { extension: { spoiler: true } });
   * // "<p>Darth Vader is <span class=\"spoiler\">Luke's father</span></p>\n"
   * ```
   *
   * @default {false}
   */
  spoiler?: boolean;

  /** Requires at least one space after a `>` character to generate a blockquote.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML(">implying implications", { extension: { greentext: true } });
   * // "<p>&gt;implying implications</p>\n"
   * ```
   *
   * @default {false}
   */
  greentext?: boolean;

  /** Recognizes many emphasis that appear in CJK contexts.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("**この文は重要です。**但这句话并不重要。", { extension: { cjkFriendlyEmphasis: true } });
   * // "<p><strong>この文は重要です。</strong>但这句话并不重要。</p>\n"
   * ```
   *
   * @default {false}
   */
  cjkFriendlyEmphasis?: boolean;
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
   * @default {null}
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

  /** Relax parsing of autolinks, allow links to be detected inside brackets
   * and allow all url schemes.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("[https://foo.com]", { extension: { autolink: true }, parse: { relaxedAutolinks: true } });
   * // "<p>[<a href=\"https://foo.com\">https://foo.com</a>]</p>\n"
   * ```
   *
   * @default {false}
   */
  relaxedAutolinks?: boolean;
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
   * @default {false}
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
   * @default {false}
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
   * @default {false}
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
   * @default {false}
   */
  unsafe?: boolean;

  /**
   * The wrap column when outputting CommonMark.
   *
   * @default {0}
   */
  width?: number;

  /** Whether to use the full info string for fenced code blocks.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("\`\`\`rust extra info\nfn hello();\n\`\`\`\n");
   * // "<pre><code class=\"language-rust\">fn hello();\n</code></pre>\n"
   *
   * markdownToHTML("\`\`\`rust extra info\nfn hello();\n\`\`\`\n", { render: { fullInfoString: true } });
   * // "<pre><code class=\"language-rust\" data-meta="extra info">fn hello();\n</code></pre>\n"
   * ```
   *
   * @default {false}
   */
  fullInfoString?: boolean;

  /** The style for list items.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("* Item\n* Item\n", { render: { listStyle: "star" } });
   * // "<ul>\n<li>Item</li>\n<li>Item</li>\n</ul>\n"
   * ```
   *
   * @default {"dash"}
   */
  listStyle?: "dash" | "plus" | "star";

  /** Include source position attributes in HTML and XML output.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("Hello *world*!", { render: { sourcepos: true } });
   * // "<p data-sourcepos=\"1:1-1:14\">Hello <em data-sourcepos=\"1:7-1:13\">world</em>!</p>\n"
   * ```
   *
   * @default {false}
   */
  sourcepos?: boolean;

  /** Wrap escaped characters in a `<span>` to allow any post-processing to recognize them.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("Notify user \\@example", { render: { escapedCharSpans: true } });
   * // "<p>Notify user <span data-escaped-char>@</span>example</p>\n"
   * ```
   *
   * @default {false}
   */
  escapedCharSpans?: boolean;

  /** Ignore setext headings in input.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("setext heading\n---", { render: { ignoreSetext: true } });
   * // "<p>setext heading</p>\n<hr />\n"
   * ```
   *
   * @default {false}
   */
  ignoreSetext?: boolean;

  /** Ignore empty links in input.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("[]()", { render: { ignoreEmptyLinks: true } });
   * // "<p>[]()</p>\n"
   * ```
   *
   * @default {false}
   */
  ignoreEmptyLinks?: boolean;

  /** Enables GFM quirks in HTML output which break CommonMark compatibility.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("****abcd****", { render: { gfmQuirks: true } });
   * // "<p><strong>abcd</strong></p>\n"
   * ```
   *
   * @default {false}
   */
  gfmQuirks?: boolean;

  /** Prefer fenced code blocks when outputting CommonMark.
   *
   * @default {false}
   */
  preferFenced?: boolean;

  /** Render the image as a figure element with the title as its caption.
   *
   * ```ts
   * import { markdownToHTML } from "@nick/comrak";
   *
   * markdownToHTML("![image](https://example.com/image.png \"this is an image\")", { render: { figureWithCaption: true } });
   * // "<p><figure><img src=\"https://example.com/image.png\" alt=\"image\" title=\"this is an image\" /><figcaption>this is an image</figcaption></figure></p>\n"
   * ```
   *
   * @default {false}
   */
  figureWithCaption?: boolean;
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
    extension_multiline_block_quotes: extension.multilineBlockQuotes ?? false,
    extension_alerts: extension.alerts ?? false,
    extension_math_dollars: extension.mathDollars ?? false,
    extension_math_code: extension.mathCode ?? false,
    extension_wikilinks_title_after_pipe: extension.wikiLinksTitleAfterPipe ?? false,
    extension_wikilinks_title_before_pipe: extension.wikiLinksTitleBeforePipe ?? false,
    extension_underline: extension.underline ?? false,
    extension_subscript: extension.subscript ?? false,
    extension_spoiler: extension.spoiler ?? false,
    extension_greentext: extension.greentext ?? false,
    extension_cjk_friendly_emphasis: extension.cjkFriendlyEmphasis ?? false,
    parse_default_info_string: parse.defaultInfoString ?? "",
    parse_smart: parse.smart ?? false,
    parse_relaxed_tasklist_matching: parse.relaxedTasklistMatching ?? false,
    parse_relaxed_autolinks: parse.relaxedAutolinks ?? false,
    render_escape: render.escape ?? false,
    render_github_pre_lang: render.githubPreLang ?? false,
    render_hardbreaks: render.hardbreaks ?? false,
    render_unsafe: render.unsafe ?? false,
    render_width: render.width ?? 0,
    render_full_info_string: render.fullInfoString ?? false,
    render_list_style: render.listStyle ?? "dash",
    render_sourcepos: render.sourcepos ?? false,
    render_escaped_char_spans: render.escapedCharSpans ?? false,
    render_ignore_setext: render.ignoreSetext ?? false,
    render_ignore_empty_links: render.ignoreEmptyLinks ?? false,
    render_gfm_quirks: render.gfmQuirks ?? false,
    render_prefer_fenced: render.preferFenced ?? false,
    render_figure_with_caption: render.figureWithCaption ?? false,
  } satisfies Options;
  return markdown_to_html(markdown, opts);
}
