// deno-coverage-ignore-file
// deno-coverage-ignore-start
import { HeadingAdapter, SyntaxHighlighterAdapter } from "./_wasm.ts";
import {
  type BrokenLinkCallbackFunction,
  Options,
  type URLRewriterFunction,
} from "./options.ts";

export type OpenTagFunction = (attrs: Record<string, string>) => string;

const ObjectEntries = Object.entries;
const JSONStringify = JSON.stringify;

function serializeAttrs(attrs: Record<string, string>): string {
  return ObjectEntries(attrs).reduce(
    (a, [k, v]) => `${a} ${k}="${JSONStringify(v).replace(/^"|"$/g, "")}"`,
    "",
  );
}
function defaultOpenTag(tag: string): OpenTagFunction {
  return (attrs) => `<${tag}${serializeAttrs(attrs)}>`;
}

export function collectOptions(options?: Options): [
  options: Omit<Options, "plugins">,
  syntaxAdapter: SyntaxHighlighterAdapter | null,
  headingAdapter: HeadingAdapter | null,
  brokenLinkCallback: BrokenLinkCallbackFunction | null,
  imageURLRewriter: URLRewriterFunction | null,
  linkURLRewriter: URLRewriterFunction | null,
] {
  const defaultOptions = Options.default();
  const { plugins, ...opts } = {
    ...defaultOptions,
    extension: {
      ...defaultOptions.extension,
      ...options?.extension,
    },
    parse: {
      ...defaultOptions.parse,
      ...options?.parse,
    },
    render: {
      ...defaultOptions.render,
      ...options?.render,
    },
    plugins: {
      ...defaultOptions.plugins,
      ...options?.plugins,
      render: {
        ...defaultOptions.plugins.render,
        ...options?.plugins?.render,
      },
    },
  } satisfies Options;

  let { brokenLinkCallback = null } = opts.parse;
  if (brokenLinkCallback && typeof brokenLinkCallback !== "function") {
    if (
      typeof brokenLinkCallback === "object" &&
      typeof brokenLinkCallback.resolve === "function"
    ) {
      const blc = brokenLinkCallback;
      brokenLinkCallback = (ref) => blc.resolve(ref);
    } else {
      brokenLinkCallback = null;
    }
  }

  let {
    imageURLRewriter = null,
    linkURLRewriter = null,
  } = opts.extension;

  if (imageURLRewriter && typeof imageURLRewriter !== "function") {
    if (
      typeof imageURLRewriter === "object" &&
      typeof imageURLRewriter.toHTML === "function"
    ) {
      const rewriter = imageURLRewriter;
      imageURLRewriter = (url) => rewriter.toHTML(url);
    } else {
      imageURLRewriter = null;
    }
  }

  if (linkURLRewriter && typeof linkURLRewriter !== "function") {
    if (
      typeof linkURLRewriter === "object" &&
      typeof linkURLRewriter.toHTML === "function"
    ) {
      const rewriter = linkURLRewriter;
      linkURLRewriter = (url) => rewriter.toHTML(url);
    } else {
      linkURLRewriter = null;
    }
  }

  const { render } = plugins;
  let syntaxAdapter: SyntaxHighlighterAdapter | null = null;
  if (render?.codefenceSyntaxHighlighter) {
    // deno-lint-ignore no-explicit-any
    const sh = render.codefenceSyntaxHighlighter as any;
    if (sh instanceof SyntaxHighlighterAdapter) {
      syntaxAdapter = sh;
    } else if (typeof sh === "object" && typeof sh?.highlight === "function") {
      syntaxAdapter = new SyntaxHighlighterAdapter(
        sh.highlight.bind(sh),
        sh.pre?.bind(sh) ?? defaultOpenTag("pre"),
        sh.code?.bind(sh) ?? defaultOpenTag("code"),
      );
    } else {
      syntaxAdapter = null;
    }
  }

  let headingAdapter: HeadingAdapter | null = null;
  if (render?.headingAdapter) {
    const ha = render.headingAdapter;
    if (ha instanceof HeadingAdapter) {
      headingAdapter = ha;
    } else if (
      typeof ha === "object" &&
      typeof ha?.enter === "function" &&
      typeof ha.exit === "function"
    ) {
      headingAdapter = new HeadingAdapter(ha.enter.bind(ha), ha.exit.bind(ha));
    } else {
      headingAdapter = null;
    }
  }

  return [
    opts,
    syntaxAdapter,
    headingAdapter,
    brokenLinkCallback,
    imageURLRewriter,
    linkURLRewriter,
  ];
}

const isArray = Array.isArray;
const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Makes all properties in an object required, recursively.
 *
 * @template T - The object type to make required.
 * @internal
 */
// deno-fmt-ignore
export type RequiredDeep<T, E = never> =
  | T extends E ? T
  // deno-lint-ignore ban-types
  : T extends Function ? T
  : T extends readonly [] | readonly [unknown, ...unknown[]]
    ? { [K in keyof T]-?: K extends `${number}` ? RequiredDeep<T[K], E> : T[K] }
  : T extends readonly (infer U)[] ? RequiredDeep<U, E>[]
  : T extends object ? { [K in keyof T]-?: RequiredDeep<T[K], E> }
  : T;

/**
 * Creates a deep clone of an object's type, collapsing any nested objects and
 * intersections into new literal object types.
 */
// deno-fmt-ignore
export type CloneDeep<T> =
  // deno-lint-ignore ban-types
  | T extends Function ? T
  : T extends readonly [] | readonly [unknown, ...unknown[]]
    ? { [K in keyof T]: K extends `${number}` ? CloneDeep<T[K]> : T[K] }
  : T extends readonly (infer U)[] ? CloneDeep<U>[]
  : T extends object ? { [K in keyof T]: CloneDeep<T[K]> }
  : T;

/**
 * Creates a deep clone of an object.
 */
export function cloneDeep<T>(obj: T): CloneDeep<T> {
  if (typeof obj !== "object" || obj === null) return obj as CloneDeep<T>;
  if (isArray(obj)) return obj.map(cloneDeep) as CloneDeep<T>;
  const cloned = {} as CloneDeep<T>;
  for (const key in obj) {
    if (!hasOwnProperty.call(obj, key)) continue;
    // deno-lint-ignore no-explicit-any
    (cloned as any)[key] = cloneDeep(obj[key]);
  }
  return cloned;
}
// deno-coverage-ignore-stop
