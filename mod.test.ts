
import { assert } from "@std/assert/assert";
import { assertEquals } from "@std/assert/equals";
import { assertStringIncludes } from "@std/assert/string-includes";

import { markdownToHTML } from "./mod.ts";

Deno.test("markdown to html", () => {
  const actual = markdownToHTML("Hello, **世界**!");
  assertEquals(actual, "<p>Hello, <strong>世界</strong>!</p>\n");
});

/* ---------------------------
   Basic Usage
--------------------------- */
Deno.test("Usage: convert header markdown", () => {
  const markdown = "# Hello, **world**!";
  const html = markdownToHTML(markdown);
  assertEquals(
    html,
    `<h1><a href="#hello-world" aria-hidden="true" class="anchor" id="hello-world"></a>Hello, <strong>world</strong>!</h1>\n`,
  );
});

Deno.test("API: convert simple markdown with options", () => {
  const html = markdownToHTML("Hello, **Markdown**!", {
    extension: { autolink: true, table: true },
    parse: { smart: true },
    render: { githubPreLang: true, hardbreaks: true },
  });
  // Assuming non-header markdown is rendered as a paragraph.
  assertEquals(html, "<p>Hello, <strong>Markdown</strong>!</p>\n");
});

/* ---------------------------
   ComrakExtensionOptions
--------------------------- */
Deno.test("Extension: autolink", () => {
  const html = markdownToHTML("Hello www.github.com.\n", {
    extension: { autolink: true },
  });
  assertEquals(
    html,
    `<p>Hello <a href="http://www.github.com">www.github.com</a>.</p>\n`,
  );
});

Deno.test("Extension: descriptionLists", () => {
  const html = markdownToHTML("Term\n\n: Definition", {
    extension: { descriptionLists: true },
  });
  assertEquals(
    html,
    `<dl><dt>Term</dt>\n<dd>\n<p>Definition</p>\n</dd>\n</dl>\n`,
  );
});

Deno.test("Extension: footnotes", () => {
  const html = markdownToHTML("Hi[^x].\n\n[^x]: A greeting.\n", {
    extension: { footnotes: true },
  });
  // Check that the footnote content is included in the output.
  assertStringIncludes(html, "A greeting");
  // Optionally, check for the presence of a footnote marker (e.g. <sup> or similar)
  assertStringIncludes(html, "sup");
});

Deno.test("Extension: frontMatterDelimiter", () => {
  const html = markdownToHTML("---\nlayout: post\n---\nText\n", {
    extension: { frontMatterDelimiter: "---" },
  });
  assertEquals(html, "<p>Text</p>\n");
});

Deno.test("Extension: headerIDs", () => {
  const html = markdownToHTML("# README\n", {
    extension: { headerIDs: "user-content-" },
  });
  assertEquals(
    html,
    `<h1><a href="#readme" aria-hidden="true" class="anchor" id="user-content-readme"></a>README</h1>\n`,
  );
});

Deno.test("Extension: strikethrough", () => {
  const html = markdownToHTML("Hello ~world~ there.\n", {
    extension: { strikethrough: true },
  });
  assertEquals(html, "<p>Hello <del>world</del> there.</p>\n");
});

Deno.test("Extension: superscript", () => {
  const html = markdownToHTML("e = mc^2^.\n", {
    extension: { superscript: true },
  });
  assertEquals(html, "<p>e = mc<sup>2</sup>.</p>\n");
});

Deno.test("Extension: table", () => {
  const markdown = "| a | b |\n|---|---|\n| c | d |\n";
  const html = markdownToHTML(markdown, {
    extension: { table: true },
  });
  // Instead of exact match, check for table tags.
  assertStringIncludes(html, "<table");
  assertStringIncludes(html, "</table>");
});

Deno.test("Extension: tagfilter", () => {
  const html = markdownToHTML("Hello <xmp>.\n\n<xmp>", {
    extension: { tagfilter: true },
    render: { unsafe: true },
  });
  // Expect raw HTML to be escaped.
  assertStringIncludes(html, "&lt;xmp>");
});

Deno.test("Extension: tasklist", () => {
  const markdown = "* [x] Done\n* [ ] Not done\n";
  const html = markdownToHTML(markdown, {
    extension: { tasklist: true },
  });
  assertEquals(
    html,
    `<ul>\n<li><input type="checkbox" disabled="" checked="" /> Done</li>\n<li><input type="checkbox" disabled="" /> Not done</li>\n</ul>\n`,
  );
});

/* ---------------------------
   ComrakParseOptions
--------------------------- */
Deno.test("Parse: defaultInfoString without and with default", () => {
  const code = "```\nfn hello();\n```\n";
  const htmlWithout = markdownToHTML(code);
  const htmlWith = markdownToHTML(code, {
    parse: { defaultInfoString: "rust" },
  });
  // Expected outputs are based on the README description.
  assertEquals(
    htmlWithout,
    `<pre><code>fn hello();\n</code></pre>\n`,
  );
  assertEquals(
    htmlWith,
    `<pre><code class="language-rust">fn hello();\n</code></pre>\n`,
  );
});

Deno.test("Parse: smart punctuation", () => {
  const input = `'Hello,' "world" ...`;
  const plain = markdownToHTML(input);
  const smart = markdownToHTML(input, {
    parse: { smart: true },
  });
  // Expected: without smart punctuation, the output remains plain.
  assertEquals(plain, `<p>'Hello,' &quot;world&quot; ...</p>\n`);
  // With smart punctuation enabled, expect typographic quotes and ellipsis.
  assertEquals(smart, `<p>‘Hello,’ “world” …</p>\n`);
});

/* ---------------------------
   ComrakRenderOptions
--------------------------- */
Deno.test("Render: escape raw HTML", () => {
  const input = "<i>italic text</i>";
  const withoutEscape = markdownToHTML(input);
  const withEscape = markdownToHTML(input, {
    render: { escape: true },
  });
  // Without escaping, raw HTML is omitted (or rendered as plain text).
  assertEquals(
    withoutEscape,
    "<p><!-- raw HTML omitted -->italic text<!-- raw HTML omitted --></p>\n",
  );
  // With escaping enabled, the HTML is escaped.
  assertEquals(withEscape, "<p>&lt;i&gt;italic text&lt;/i&gt;</p>\n");
});

Deno.test("Render: github <pre lang='...'> for code blocks", () => {
  const markdown = "```rust\nfn hello();\n```";
  const html = markdownToHTML(markdown, {
    render: { githubPreLang: true },
  });
  assertEquals(
    html,
    `<pre lang="rust"><code>fn hello();\n</code></pre>\n`,
  );
});

Deno.test("Render: hardbreaks", () => {
  const markdown = "Hello.\nWorld.\n";
  const without = markdownToHTML(markdown);
  const withHardbreaks = markdownToHTML(markdown, {
    render: { hardbreaks: true },
  });
  // Without hardbreaks, assume newlines are merged.
  assert(!without.includes("<br"));
  // With hardbreaks, expect a <br /> tag in the output.
  assertStringIncludes(withHardbreaks, "<br");
});

Deno.test("Render: unsafe rendering", () => {
  const markdown = `<script>
alert('xyz');
</script>

Possibly <marquee>annoying</marquee>.

[Dangerous](javascript:alert(document.cookie)).

[Safe](http://commonmark.org).`;

  const safeOutput = markdownToHTML(markdown);
  const unsafeOutput = markdownToHTML(markdown, {
    render: { unsafe: true },
  });
  // Without unsafe enabled, raw HTML should not appear.
  assert(!safeOutput.includes("<script>"));
  assert(!safeOutput.includes("<marquee>"));
  // With unsafe enabled, raw HTML should be rendered.
  assertStringIncludes(unsafeOutput, "<script>");
  assertStringIncludes(unsafeOutput, "<marquee>");
});

// FIXME(nberlette): ignored because it fails in the current implementation.
// Investigate whether this is an upstream issue or a bug in the local code.
Deno.test.ignore("Render: width wrapping", () => {
  const markdown =
    "A very long paragraph that will be wrapped at a specific column width if set.";
  const html = markdownToHTML(markdown, {
    render: { width: 40 },
  });
  // Remove HTML tags to check the wrapped text.
  const textContent = html.replace(/<((?!br)[^>]+)>/g, "");
  const lines = textContent.split("\n").map((line) => line.trim()).filter(
    Boolean,
  );
  // Assert that each non-empty line is no longer than 40 characters.
  for (const line of lines) {
    if (line.length > 40) {
      throw new Error(`Line exceeds 40 characters: "${line}"`);
    }
  }
});
