import { describe, it, type TestContext } from "node:test";

import { markdownToCommonMark } from "./cm.ts";

describe("markdownToCommonMark", () => {
  describe("RenderOptions", () => {
    // TODO(nberlette): enable this test once wrapping is implemented, which
    // requires parsing the markdown to an AST via `comrak::parse_document`,
    // and then formatting it into commonmark with `comrak::format_commonmark`
    // or similar. Currently `comrak::markdown_to_html` does not respect this.
    it("should wrap output when width is set", (t: TestContext) => {
      const markdown =
        "# Howdy!\n\nThis is a very long paragraph that will be wrapped at a specific column width if set.\n\nI hope this works well. But hey, if it doesn't... well, at least we tried, right?\n\n## Subsection\n\nHere's another paragraph to see how it handles multiple paragraphs in the input markdown.\n\n---\n\nSome final text to conclude the test case.\n\n> buhbye! loljk, wrap me if you can! leonardo dewrapio is my name, and wrapping long lines of commonmark text is my game.\n> holy crap please just wrap me already. like a car, with vinyl. or a burrito. or a song, if you're slim shady. or a present, if you're santa. or a blunt, if you're a stoner. or a mummy, if you're ancient egyptian (or british?).\n> ok i think i've made my point. wrap me.\n";
      const cm = markdownToCommonMark(markdown, { render: { width: 40 } });
      if (Deno.env.get("DEBUG")) {
        console.log(
          "\nDEBUG OUTPUT\n" +
            "-".repeat(50) + "\n" + cm + "\n" + "-".repeat(50),
        );
      }
      t.assert.ok(cm.includes("\n"), "Expected newline not found");
      const lines = cm.split(/\r?\n/).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trimEnd();
        t.assert.ok(
          line.length <= 40,
          `Excessive line length (limit 40):\n` +
            (i > 0
              ? `\x1b[2m    ${i} | \x1b[39m${lines[i - 1]}\x1b[0m\n`
              : "") +
            `\x1b[90m    ${i + 1} | \x1b[39;1m${line}\x1b[0m\n` +
            (i < lines.length - 1
              ? `\x1b[2m    ${i + 2} | \x1b[39m${lines[i + 1]}\x1b[0m\n`
              : ""),
        );
      }
    });
  });
});

describe("renderCommonMark", () => {
});
