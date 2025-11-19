// deno-lint-ignore no-import-prefix
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "jsr:@std/assert@1.0.15";
import { describe, it } from "node:test";

import { markdownToHTML } from "./mod.ts";

describe("markdownToHTML", () => {
  describe("basic functionality and sanity checks", () => {
    it("should be a function", (t) => {
      const assert: typeof t.assert = t.assert;
      assert.strictEqual(typeof markdownToHTML, "function");
    });

    it("should convert simple markdown to HTML", (t) => {
      const assert: typeof t.assert = t.assert;
      const input = "Hello, **world**!";
      const expectedOutput = "<p>Hello, <strong>world</strong>!</p>\n";
      const actualOutput = markdownToHTML(input);
      assert.strictEqual(actualOutput, expectedOutput);
    });

    it("should handle empty input", (t) => {
      const assert: typeof t.assert = t.assert;
      const input = "";
      const expectedOutput = "";
      const actualOutput = markdownToHTML(input);
      assert.strictEqual(actualOutput, expectedOutput);
    });

    it("should support CJK characters", (t) => {
      const assert: typeof t.assert = t.assert;
      const actual = markdownToHTML("Hello, **世界**!");
      assert.strictEqual(actual, "<p>Hello, <strong>世界</strong>!</p>\n");
    });
  });

  describe("basic usage", () => {
    it("should convert header markdown", (t) => {
      const assert: typeof t.assert = t.assert;
      const markdown = "# Hello, **world**!";
      const html = markdownToHTML(markdown);
      assert.strictEqual(
        html,
        `<h1><a href="#hello-world" aria-hidden="true" class="anchor" id="hello-world"></a>Hello, <strong>world</strong>!</h1>\n`,
      );
    });

    it("should convert simple markdown with options", (t) => {
      const assert: typeof t.assert = t.assert;
      const html = markdownToHTML("Hello, **Markdown**!", {
        extension: { autolink: true, table: true },
        parse: { smart: true },
        render: { githubPreLang: true, hardbreaks: true },
      });
      // Assuming non-header markdown is rendered as a paragraph.
      assert.strictEqual(html, "<p>Hello, <strong>Markdown</strong>!</p>\n");
    });
  });

  describe("ExtensionOptions", () => {
    it("should support autolink extension", (t) => {
      const assert: typeof t.assert = t.assert;
      const html = markdownToHTML("Hello www.github.com.\n", {
        extension: { autolink: true },
      });
      assert.strictEqual(
        html,
        `<p>Hello <a href="http://www.github.com">www.github.com</a>.</p>\n`,
      );
    });

    it("should support descriptionLists extension", (t) => {
      const assert: typeof t.assert = t.assert;
      const html = markdownToHTML("Term\n\n: Definition", {
        extension: { descriptionLists: true },
      });
      assert.strictEqual(
        html,
        `<dl>\n<dt>Term</dt>\n<dd>\n<p>Definition</p>\n</dd>\n</dl>\n`,
      );
    });

    it("should support footnotes extension", (t) => {
      const assert: typeof t.assert = t.assert;
      const html = markdownToHTML("Hi[^x].\n\n[^x]: A greeting.\n", {
        extension: { footnotes: true },
      });
      // Check that the footnote content is included in the output.
      assertStringIncludes(html, "A greeting");
      // Optionally, check for the presence of a footnote marker (e.g. <sup> or similar)
      assertStringIncludes(html, "sup");
    });

    it("should support frontMatterDelimiter extension", (t) => {
      const assert: typeof t.assert = t.assert;
      const html = markdownToHTML("---\nlayout: post\n---\nText\n", {
        extension: { frontMatterDelimiter: "---" },
      });
      assert.strictEqual(html, "<p>Text</p>\n");
    });

    it("should support headerIDs extension", (t) => {
      const assert: typeof t.assert = t.assert;
      const html = markdownToHTML("# README\n", {
        extension: { headerIDs: "user-content-" },
      });
      assert.strictEqual(
        html,
        `<h1><a href="#readme" aria-hidden="true" class="anchor" id="user-content-readme"></a>README</h1>\n`,
      );
    });

    it("should support strikethrough extension", () => {
      const html = markdownToHTML("Hello ~world~ there.\n", {
        extension: { strikethrough: true },
      });
      assertEquals(html, "<p>Hello <del>world</del> there.</p>\n");
    });

    it("should support superscript extension", () => {
      const html = markdownToHTML("e = mc^2^.\n", {
        extension: { superscript: true },
      });
      assertEquals(html, "<p>e = mc<sup>2</sup>.</p>\n");
    });

    it("should support table extension", () => {
      const markdown = "| a | b |\n|---|---|\n| c | d |\n";
      const html = markdownToHTML(markdown, {
        extension: { table: true },
      });
      assertStringIncludes(html, "<table");
      assertStringIncludes(html, "</table>");
    });

    it("should support tagfilter extension", () => {
      const html = markdownToHTML("Hello <xmp>.\n\n<xmp>", {
        extension: { tagfilter: true },
        render: { unsafe: true },
      });
      assertStringIncludes(html, "&lt;xmp>");
    });

    it("should support tasklist extension", () => {
      const markdown = "* [x] Done\n* [ ] Not done\n";
      const html = markdownToHTML(markdown, {
        extension: { tasklist: true },
      });
      assertEquals(
        html,
        `<ul>\n<li><input type="checkbox" checked="" disabled="" /> Done</li>\n<li><input type="checkbox" disabled="" /> Not done</li>\n</ul>\n`,
      );
    });
  });

  describe("ParseOptions", () => {
    it("should respect defaultInfoString option", () => {
      const code = "```\nfn hello();\n```\n";
      const htmlWithout = markdownToHTML(code);
      const htmlWith = markdownToHTML(code, {
        parse: { defaultInfoString: "rust" },
      });
      assertEquals(
        htmlWithout,
        `<pre><code>fn hello();\n</code></pre>\n`,
      );
      assertEquals(
        htmlWith,
        `<pre><code class="language-rust">fn hello();\n</code></pre>\n`,
      );
    });

    it("should support smart punctuation", () => {
      const input = `'Hello,' "world" ...`;
      const plain = markdownToHTML(input);
      const smart = markdownToHTML(input, {
        parse: { smart: true },
      });
      assertEquals(plain, `<p>'Hello,' &quot;world&quot; ...</p>\n`);
      assertEquals(smart, `<p>‘Hello,’ “world” …</p>\n`);
    });

    it("should support relaxed tasklist matching", () => {
      const markdown =
        "* [x] Done\n* [ ] Not done\n* [-] Also done\n* [ ] Also not done\n";
      const html = markdownToHTML(markdown, {
        extension: { tasklist: true },
        parse: { relaxedTasklistMatching: true },
      });
      assertEquals(
        html,
        `<ul>\n<li><input type="checkbox" checked="" disabled="" /> Done</li>\n<li><input type="checkbox" disabled="" /> Not done</li>\n<li><input type="checkbox" checked="" disabled="" /> Also done</li>\n<li><input type="checkbox" disabled="" /> Also not done</li>\n</ul>\n`,
      );

      const htmlStrict = markdownToHTML(markdown, {
        extension: { tasklist: true },
        parse: { relaxedTasklistMatching: false },
      });
      assertEquals(
        htmlStrict,
        `<ul>\n<li><input type="checkbox" checked="" disabled="" /> Done</li>\n<li><input type="checkbox" disabled="" /> Not done</li>\n<li>[-] Also done</li>\n<li><input type="checkbox" disabled="" /> Also not done</li>\n</ul>\n`,
      );
    });
  });

  describe("RenderOptions", () => {
    it("should escape raw HTML when requested", () => {
      const input = "<i>italic text</i>";
      const withoutEscape = markdownToHTML(input);
      const withEscape = markdownToHTML(input, {
        render: { escape: true },
      });
      assertEquals(
        withoutEscape,
        "<p><!-- raw HTML omitted -->italic text<!-- raw HTML omitted --></p>\n",
      );
      assertEquals(withEscape, "<p>&lt;i&gt;italic text&lt;/i&gt;</p>\n");
    });

    it("should support githubPreLang rendering", () => {
      const markdown = "```rust\nfn hello();\n```";
      const html = markdownToHTML(markdown, {
        render: { githubPreLang: true },
      });
      assertEquals(
        html,
        `<pre lang="rust"><code>fn hello();\n</code></pre>\n`,
      );
    });

    it("should support hardbreak rendering", () => {
      const markdown = "Hello.\nWorld.\n";
      const without = markdownToHTML(markdown);
      const withHardbreaks = markdownToHTML(markdown, {
        render: { hardbreaks: true },
      });
      assert(!without.includes("<br"));
      assertStringIncludes(withHardbreaks, "<br");
    });

    it("should handle unsafe rendering option", () => {
      const markdown = "" +
        "<script>\nalert('xyz');\n</script>\n\n" +
        "Possibly <marquee>annoying</marquee>.\n\n" +
        "[Dangerous](javascript:alert(document.cookie)).\n\n" +
        "[Safe](http://commonmark.org).";

      const safeOutput = markdownToHTML(markdown);
      const unsafeOutput = markdownToHTML(markdown, {
        render: { unsafe: true },
      });
      assert(!safeOutput.includes("<script>"));
      assert(!safeOutput.includes("<marquee>"));
      assertStringIncludes(unsafeOutput, "<script>");
      assertStringIncludes(unsafeOutput, "<marquee>");
    });

    // TODO(nberlette): enable this test once wrapping is implemented, which
    // requires parsing the markdown to an AST via `comrak::parse_document`,
    // and then formatting it into commonmark with `comrak::format_commonmark`
    // or similar. Currently `comrak::markdown_to_html` does not respect this.
    it.skip("should wrap output when width is set", () => {
      const markdown =
        "A very long paragraph that will be wrapped at a specific column width if set. I hope this works well. But hey, if it doesn't, at least we tried!\n\nAnother paragraph to see how it handles multiple paragraphs in the input markdown.\n\n---\n\n# A Header That Is Also Quite Long and Might Need Wrapping\n\nSome final text to conclude the test case.\n\n> buhbye! loljk, wrap me if you can! leonardo dewrapio is my name, and wrapping long lines of commonmark text is my game. holy crap please just wrap me. like a car, with vinyl. or a burrito. or a song, if you're slim shady. or a present, if you're santa. or a blunt, if you're a stoner. or a mummy, if you're ancient egyptian (or british?). ok i think i've made my point. wrap me.\n";
      const html = markdownToHTML(markdown, {
        render: { width: 40, hardbreaks: true },
      });
      console.log(html);
      assertStringIncludes(html, "\n");
      const textContent = html.replace(/<((?!br)[^>]+)>/g, "");
      const lines = textContent.split("\n").map((line) => line.trim()).filter(
        Boolean,
      );
      for (const line of lines) {
        if (line.length > 40) {
          throw new Error(`Line exceeds 40 characters: "${line}"`);
        }
      }
    });
  });
});
