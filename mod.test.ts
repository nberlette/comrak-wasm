import { assertEquals } from "@std/assert/equals";
import { markdownToHTML } from "./mod.ts";

Deno.test("markdown to html", () => {
  const actual = markdownToHTML("Hello, **世界**!");
  assertEquals(actual, "<p>Hello, <strong>世界</strong>!</p>\n");
});
