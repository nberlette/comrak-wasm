// deno-coverage-ignore-file
// deno-coverage-ignore-start
import * as wasm from "../lib/comrak_wasm.js";

const setPrototypeOf = Object.setPrototypeOf;
const isPrototypeOf = Object.isPrototypeOf;
// Set up prototype chain for the syntect adapter class
// (janky, but otherwise the wasm-bindgen glue will throw errors)
if (
  "SyntectAdapter" in wasm &&
  typeof wasm.SyntectAdapter === "function" &&
  "SyntaxHighlighterAdapter" in wasm &&
  typeof wasm.SyntaxHighlighterAdapter === "function"
) {
  const target = wasm.SyntectAdapter.prototype;
  const proto = wasm.SyntaxHighlighterAdapter.prototype;

  if (target && proto && !isPrototypeOf.call(proto, target)) {
    setPrototypeOf(target, proto);
  }
}

export default wasm;

export * from "../lib/comrak_wasm.js";

// deno-coverage-ignore-stop
