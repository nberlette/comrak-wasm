import { describe, it, type TestContext } from "node:test";

import { legacy } from "./scripts/parse_comrak_version.ts";
import { markdownToHTML } from "./mod.ts";

describe("markdownToHTML", () => {
  describe("basic functionality and sanity checks", () => {
    it("should be a function", (t: TestContext) => {
      t.assert.strictEqual(typeof markdownToHTML, "function");
    });

    it("should convert simple markdown to HTML", (t: TestContext) => {
      const input = "Hello, **world**!";
      const expectedOutput = "<p>Hello, <strong>world</strong>!</p>\n";
      const actualOutput = markdownToHTML(input);
      t.assert.strictEqual(actualOutput, expectedOutput);
    });

    it("should handle empty input", (t: TestContext) => {
      const input = "";
      const expectedOutput = "";
      const actualOutput = markdownToHTML(input);
      t.assert.strictEqual(actualOutput, expectedOutput);
    });

    it("should support CJK characters", (t: TestContext) => {
      const actual = markdownToHTML("Hello, **世界**!");
      t.assert.strictEqual(actual, "<p>Hello, <strong>世界</strong>!</p>\n");
    });
  });

  describe("basic usage", () => {
    it("should convert header markdown", (t: TestContext) => {
      const markdown = "# Hello, **world**!";
      const html = markdownToHTML(markdown);
      t.assert.strictEqual(
        html,
        `<h1>${
          legacy
            ? '<a href="#hello-world" aria-hidden="true" class="anchor" id="hello-world"></a>'
            : ""
        }Hello, <strong>world</strong>!</h1>\n`,
      );
    });

    it("should convert simple markdown with options", (t: TestContext) => {
      const html = markdownToHTML("Hello, **Markdown**!", {
        extension: { autolink: true, table: true },
        parse: { smart: true },
        render: { githubPreLang: true, hardbreaks: true },
      });
      // Assuming non-header markdown is rendered as a paragraph.
      t.assert.strictEqual(html, "<p>Hello, <strong>Markdown</strong>!</p>\n");
    });
  });

  describe("ExtensionOptions", () => {
    it("should support autolink extension", (t: TestContext) => {
      const html = markdownToHTML("Hello www.github.com.\n", {
        extension: { autolink: true },
      });
      t.assert.strictEqual(
        html,
        `<p>Hello <a href="http://www.github.com">www.github.com</a>.</p>\n`,
      );
    });

    it("should support descriptionLists extension", (t: TestContext) => {
      const html = markdownToHTML("Term\n\n: Definition", {
        extension: { descriptionLists: true },
      });
      t.assert.strictEqual(
        html,
        `<dl>${
          legacy ? "" : "\n"
        }<dt>Term</dt>\n<dd>\n<p>Definition</p>\n</dd>\n</dl>\n`,
      );
    });

    it("should support footnotes extension", (t: TestContext) => {
      const html = markdownToHTML("Hi[^x].\n\n[^x]: A greeting.\n", {
        extension: { footnotes: true },
      });
      // Check that the footnote content is included in the output.
      t.assert.ok(html.includes("A greeting."), "Footnote content missing");
      // Optionally, check for the presence of a footnote marker (e.g. <sup> or similar)
      t.assert.ok(html.includes("<sup"), "Footnote marker missing");
    });

    it("should support frontMatterDelimiter extension", (t: TestContext) => {
      const html = markdownToHTML("---\nlayout: post\n---\nText\n", {
        extension: { frontMatterDelimiter: "---" },
      });
      t.assert.strictEqual(html, "<p>Text</p>\n");
    });

    it("should support headerIDs extension", (t: TestContext) => {
      const html = markdownToHTML("# README\n", {
        extension: { headerIDs: "user-content-" },
      });
      t.assert.strictEqual(
        html,
        `<h1><a href="#readme" aria-hidden="true" class="anchor" id="user-content-readme"></a>README</h1>\n`,
      );
    });

    it("should support strikethrough extension", (t: TestContext) => {
      const html = markdownToHTML("Hello ~world~ there.\n", {
        extension: { strikethrough: true },
      });
      t.assert.strictEqual(html, "<p>Hello <del>world</del> there.</p>\n");
    });

    it("should support superscript extension", (t: TestContext) => {
      const html = markdownToHTML("e = mc^2^.\n", {
        extension: { superscript: true },
      });
      t.assert.strictEqual(html, "<p>e = mc<sup>2</sup>.</p>\n");
    });

    it("should support table extension", (t: TestContext) => {
      const markdown = "| a | b |\n|---|---|\n| c | d |\n";
      const html = markdownToHTML(markdown, {
        extension: { table: true },
      });
      t.assert.ok(html.includes("<table"), "Table element missing");
      t.assert.ok(html.includes("</table>"), "Table closing tag missing");
    });

    it("should support tagfilter extension", (t: TestContext) => {
      const html = markdownToHTML("Hello <xmp>.\n\n<xmp>", {
        extension: { tagfilter: true },
        render: { unsafe: true },
      });
      t.assert.ok(html.includes("&lt;xmp>"), "Tag filter not applied");
    });

    it("should support tasklist extension", (t: TestContext) => {
      const markdown = "* [x] Done\n* [ ] Not done\n";
      const html = markdownToHTML(markdown, {
        extension: { tasklist: true },
      });
      t.assert.strictEqual(
        html,
        `<ul>\n` +
          `<li><input type="checkbox" ${
            legacy ? 'disabled="" checked=""' : 'checked="" disabled=""'
          } /> Done</li>\n` +
          `<li><input type="checkbox" disabled="" /> Not done</li>\n` +
          `</ul>\n`,
      );
    });
  });

  describe("ParseOptions", () => {
    it("should respect defaultInfoString option", (t: TestContext) => {
      const code = "```\nfn hello();\n```\n";
      const htmlWithout = markdownToHTML(code);
      const htmlWith = markdownToHTML(code, {
        parse: { defaultInfoString: "rust" },
      });
      t.assert.strictEqual(
        htmlWithout,
        `<pre><code>fn hello();\n</code></pre>\n`,
      );
      t.assert.strictEqual(
        htmlWith,
        `<pre><code class="language-rust">fn hello();\n</code></pre>\n`,
      );
    });

    it("should support smart punctuation", (t: TestContext) => {
      const input = `'Hello,' "world" ...`;
      const plain = markdownToHTML(input);
      const smart = markdownToHTML(input, {
        parse: { smart: true },
      });
      t.assert.strictEqual(plain, `<p>'Hello,' &quot;world&quot; ...</p>\n`);
      t.assert.strictEqual(smart, `<p>‘Hello,’ “world” …</p>\n`);
    });

    it("should support relaxed tasklist matching", (t: TestContext) => {
      const markdown =
        "* [x] Done\n* [ ] Not done\n* [-] Also done\n* [ ] Also not done\n";
      const html = markdownToHTML(markdown, {
        extension: { tasklist: true },
        parse: { relaxedTasklistMatching: true },
      });
      t.assert.strictEqual(
        html,
        `<ul>\n` +
          `<li><input type="checkbox" ${
            legacy ? 'disabled="" checked=""' : 'checked="" disabled=""'
          } /> Done</li>\n` +
          `<li><input type="checkbox" disabled="" /> Not done</li>\n` +
          `<li><input type="checkbox" ${
            legacy ? 'disabled="" checked=""' : 'checked="" disabled=""'
          } /> Also done</li>\n` +
          `<li><input type="checkbox" disabled="" /> Also not done</li>\n` +
          `</ul>\n`,
      );

      const htmlStrict = markdownToHTML(markdown, {
        extension: { tasklist: true },
        parse: { relaxedTasklistMatching: false },
      });
      t.assert.strictEqual(
        htmlStrict,
        `<ul>\n` +
          `<li><input type="checkbox" ${
            legacy ? 'disabled="" checked=""' : 'checked="" disabled=""'
          } /> Done</li>\n` +
          `<li><input type="checkbox" disabled="" /> Not done</li>\n` +
          `<li>[-] Also done</li>\n` +
          `<li><input type="checkbox" disabled="" /> Also not done</li>\n` +
          `</ul>\n`,
      );
    });
  });

  describe("RenderOptions", () => {
    it("should escape raw HTML when requested", (t: TestContext) => {
      const input = "<i>italic text</i>";
      const withoutEscape = markdownToHTML(input);
      const withEscape = markdownToHTML(input, {
        render: { escape: true },
      });
      t.assert.strictEqual(
        withoutEscape,
        "<p><!-- raw HTML omitted -->italic text<!-- raw HTML omitted --></p>\n",
      );
      t.assert.strictEqual(
        withEscape,
        "<p>&lt;i&gt;italic text&lt;/i&gt;</p>\n",
      );
    });

    it("should support githubPreLang rendering", (t: TestContext) => {
      const markdown = "```rust\nfn hello();\n```";
      const html = markdownToHTML(markdown, {
        render: { githubPreLang: true },
      });
      t.assert.strictEqual(
        html,
        `<pre lang="rust"><code>fn hello();\n</code></pre>\n`,
      );
    });

    it("should support hardbreak rendering", (t: TestContext) => {
      const markdown = "Hello.\nWorld.\n";
      const without = markdownToHTML(markdown);
      const withHardbreaks = markdownToHTML(markdown, {
        render: { hardbreaks: true },
      });
      t.assert.ok(!without.includes("<br"));
      t.assert.ok(withHardbreaks.includes("<br"), "Hardbreaks not rendered");
    });

    it("should handle unsafe rendering option", (t: TestContext) => {
      const markdown = "" +
        "<script>\nalert('xyz');\n</script>\n\n" +
        "Possibly <marquee>annoying</marquee>.\n\n" +
        "[Dangerous](javascript:alert(document.cookie)).\n\n" +
        "[Safe](http://commonmark.org).";

      const safeOutput = markdownToHTML(markdown);
      const unsafeOutput = markdownToHTML(markdown, {
        render: { unsafe: true },
      });
      t.assert.ok(!safeOutput.includes("<script>"), "Script tag not filtered");
      t.assert.ok(
        !safeOutput.includes("<marquee>"),
        "Marquee tag not filtered",
      );
      t.assert.ok(unsafeOutput.includes("<script>"), "Script tag missing");
      t.assert.ok(unsafeOutput.includes("<marquee>"), "Marquee tag missing");
    });
  });
});
