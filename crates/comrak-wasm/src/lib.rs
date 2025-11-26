extern crate alloc;

use std::borrow::Cow;
use std::collections::HashMap;
use std::sync::Arc;

use comrak::Arena;
use comrak::Options as ComrakOptions;
use comrak::ResolvedReference;
use comrak::adapters::HeadingAdapter as ComrakHeadingAdapter;
use comrak::adapters::HeadingMeta;
use comrak::nodes::AstNode;
use comrak::nodes::Sourcepos;
use comrak::options::BrokenLinkCallback as ComrakBrokenLinkCallback;
use comrak::options::BrokenLinkReference;
use comrak::options::Plugins;
use comrak::options::URLRewriter as ComrakURLRewriter;
#[cfg(feature = "syntect")]
use comrak::plugins::syntect::SyntectAdapter;
#[cfg(feature = "syntect")]
use comrak::plugins::syntect::SyntectAdapterBuilder;
use js_sys::Function;
use js_sys::Object;
use js_sys::TypeError;
#[cfg(all(
  target_arch = "wasm32",
  feature = "alloc",
  not(feature = "threading")
))]
use lol_alloc::AssumeSingleThreaded as Allocator;
#[cfg(all(target_arch = "wasm32", feature = "alloc"))]
use lol_alloc::FreeListAllocator as Lol;
#[cfg(all(
  target_arch = "wasm32",
  feature = "alloc",
  feature = "threading"
))]
use lol_alloc::LockedAllocator as Allocator;
use serde::Deserialize;
use serde_wasm_bindgen::from_value;
use serde_wasm_bindgen::to_value;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::*;
// conditional global allocator configuration
#[cfg(all(target_arch = "wasm32", feature = "alloc"))]
#[global_allocator]
// SAFETY: This app is single threaded, so AssumeSingleThreaded is allowed.
#[cfg_attr(feature = "threading", allow(unused_unsafe))]
static ALLOCATOR: Allocator<Lol> = unsafe { Allocator::new(Lol::new()) };

#[wasm_bindgen(typescript_custom_section)]
/// # IMPORTANT
///
/// This string literal MUST be kept in sync with the structure and types of
/// the TypeScript side of the codebase. If any files are renamed or types are
/// changed, this string literal must be updated accordingly.
///
/// Thank you :)
pub const COMRAK_TYPES: &'static str = r###"
import type {
  Options,
  ExtensionOptions,
  ParseOptions,
  RenderOptions,
  BrokenLinkCallbackFunction,
  BrokenLinkReference,
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
"###;

#[cfg(feature = "syntect")]
mod syntax_adapter {
  use ::core::ops::Deref;
  use ::core::ops::DerefMut;
  use comrak::plugins::syntect::SyntectAdapter;
  use comrak::plugins::syntect::SyntectAdapterBuilder;

  use super::*;

  /// A syntax highlighter adapter that uses Syntect for code block highlighting.
  ///
  /// # Example
  ///
  /// ```ts
  /// import { markdownToHTML, SyntaxHighlighterAdapter } from "comrak";
  /// import assert from "node:assert";
  ///
  /// const html = markdownToHTML("```ts\nconst x: number = 42;\n```", {
  ///   plugins: {
  ///     render: {
  ///       codefenceSyntaxHighlighter:
  ///         new SyntaxHighlighterAdapter("base16-ocean.dark"),
  ///     }
  ///   },
  /// });
  ///
  /// assert.equal(html, '<pre style="background-color:#2b303b;"><code class="language-ts"><span style="color:#c0c5ce;">const x: number = 42;\n</span></code></pre>\n');
  /// ```
  #[derive(Debug)]
  #[wasm_bindgen]
  pub struct SyntaxHighlighterAdapter(SyntectAdapter);

  #[wasm_bindgen]
  impl SyntaxHighlighterAdapter {
    /// Creates a new `SyntaxHighlighterAdapter` using the specified theme.
    #[wasm_bindgen(constructor)]
    pub fn new(theme: &str) -> Self {
      let adapter = SyntectAdapter::new_js(theme);
      SyntaxHighlighterAdapter(adapter)
    }
  }

  impl<'p> From<SyntaxHighlighterAdapter>
    for &'p dyn ComrakSyntaxHighlighterAdapter
  {
    fn from(adapter: SyntaxHighlighterAdapter) -> Self {
      Box::leak(Box::new(adapter.0)) as &'p dyn ComrakSyntaxHighlighterAdapter
    }
  }

  impl Deref for SyntaxHighlighterAdapter {
    type Target = SyntectAdapter;

    fn deref(&self) -> &Self::Target {
      &self.0
    }
  }

  impl DerefMut for SyntaxHighlighterAdapter {
    fn deref_mut(&mut self) -> &mut Self::Target {
      &mut self.0
    }
  }
}

#[cfg(not(feature = "syntect"))]
mod syntax_adapter {
  use comrak::adapters::SyntaxHighlighterAdapter as ComrakSyntaxHighlighterAdapter;
  use js_sys::Function;
  use serde_wasm_bindgen::to_value;
  use wasm_bindgen::prelude::*;

  use super::*;

  /// The `SyntaxHighlighterAdapter` API allows you to customize how code blocks
  /// are highlighted by Comrak, by specifying three custom rendering methods:
  ///
  /// 1. `highlight(code: string, lang?: string | null): string` - highlights
  ///    the code block content based on the specified language tag (if any),
  ///    returning the highlighted HTML string.
  /// 2. `pre(attrs: Record<string, string>): string` - renders the opening
  ///    `<pre>` tag with the provided attributes, returning the HTML string.
  /// 3. `code(attrs: Record<string, string>): string` - renders the opening
  ///    `<code>` tag with the provided attributes, returning the HTML string.
  #[derive(Default, Debug, Clone)]
  #[wasm_bindgen]
  pub struct SyntaxHighlighterAdapter {
    highlight: Function,
    pre:       Function,
    code:      Function,
  }

  #[wasm_bindgen]
  impl SyntaxHighlighterAdapter {
    #[wasm_bindgen(constructor)]
    pub fn new(
      #[wasm_bindgen(
        unchecked_param_type = r#"(code: string, lang?: string | null) => string"#
      )]
      highlight: Function,
      #[wasm_bindgen(
        unchecked_param_type = r#"(attrs: Record<string, string>) => string"#
      )]
      pre: Function,
      #[wasm_bindgen(
        unchecked_param_type = r#"(attrs: Record<string, string>) => string"#
      )]
      code: Function,
    ) -> SyntaxHighlighterAdapter {
      SyntaxHighlighterAdapter { highlight, pre, code }
    }
  }

  unsafe impl Send for SyntaxHighlighterAdapter {}
  unsafe impl Sync for SyntaxHighlighterAdapter {}

  impl ComrakSyntaxHighlighterAdapter for SyntaxHighlighterAdapter {
    fn write_highlighted(
      &self,
      out: &mut dyn std::fmt::Write,
      lang: Option<&str>,
      code: &str,
    ) -> std::fmt::Result {
      let lang_js = lang.map(|s| JsValue::from_str(s)).unwrap_or(JsValue::NULL);
      let code_js = JsValue::from_str(code);
      // we switch the two arguments around to allow easier binding from JS
      // when highlighting codeblocks without any language metadata specified
      let result = self.highlight.call2(&JsValue::NULL, &code_js, &lang_js);
      if let Ok(js) = result {
        if let Some(s) = js.as_string() {
          return out.write_str(&s);
        }
      }
      Ok(())
    }

    fn write_pre_tag<'s>(
      &self,
      out: &mut dyn std::fmt::Write,
      attrs: HashMap<&'static str, Cow<'s, str>>,
    ) -> std::fmt::Result {
      let js_attrs = to_value(&attrs).map_err(|_| std::fmt::Error)?;
      let result = self.pre.call1(&JsValue::NULL, &js_attrs);
      if let Ok(js) = result {
        if let Some(s) = js.as_string() {
          return out.write_str(&s);
        }
      }
      Ok(())
    }

    fn write_code_tag<'s>(
      &self,
      out: &mut dyn std::fmt::Write,
      attrs: HashMap<&'static str, Cow<'s, str>>,
    ) -> std::fmt::Result {
      let js_attrs = to_value(&attrs).map_err(|_| std::fmt::Error)?;
      let result = self.code.call1(&JsValue::NULL, &js_attrs);
      if let Ok(js) = result {
        if let Some(s) = js.as_string() {
          return out.write_str(&s);
        }
      }
      Ok(())
    }
  }

  impl<'p> From<SyntaxHighlighterAdapter>
    for &'p dyn ComrakSyntaxHighlighterAdapter
  {
    fn from(adapter: SyntaxHighlighterAdapter) -> Self {
      Box::leak(Box::new(adapter)) as &'p dyn ComrakSyntaxHighlighterAdapter
    }
  }
}

pub use syntax_adapter::SyntaxHighlighterAdapter;

/// The `HeadingAdapter` API allows you to customize how headings are rendered
/// by Comrak (`h1`, `h2`, ...) via custom `enter` and `exit` methods.
///
/// The `enter` and `exit` methods define what is rendered before and after the
/// heading content, respectively. Both receive {@linkcode HeadingMeta} objects
/// for their contextual `this` binding and first argument, which provide them
/// with the heading level and content. The actual AST content of the heading
/// remains unchanged.
///
/// # Methods
///
/// ## `enter`
///
/// The `enter` method is called **once** for each heading immediately before
/// rendering its content, and as such, should render the opening tag and any
/// attributes it has.
///
/// ## `exit`
///
/// The `exit` method - also called **once** - is invoked immediately _after_
/// the heading content has been rendered, and should render the closing tag.
#[wasm_bindgen]
#[derive(Default, Debug, Clone)]
pub struct HeadingAdapter {
  enter: Function,
  exit:  Function,
}

unsafe impl Send for HeadingAdapter {}
unsafe impl Sync for HeadingAdapter {}

#[wasm_bindgen]
impl HeadingAdapter {
  #[wasm_bindgen(constructor)]
  pub fn new(
    #[wasm_bindgen(
      unchecked_param_type = r#"(this: HeadingMeta, heading: HeadingMeta, sourcepos?: Sourcepos) => string"#
    )]
    enter: Function,
    #[wasm_bindgen(
      unchecked_param_type = r#"(this: HeadingMeta, heading: HeadingMeta) => string"#
    )]
    exit: Function,
  ) -> Self {
    Self { enter, exit }
  }
}

impl ComrakHeadingAdapter for HeadingAdapter {
  fn enter(
    &self,
    out: &mut dyn std::fmt::Write,
    heading: &HeadingMeta,
    sourcepos: Option<Sourcepos>,
  ) -> std::fmt::Result {
    let heading_js =
      to_value(&heading).map_err(|_| std::fmt::Error::default())?;
    let sourcepos_js = match sourcepos {
      | Some(sp) => to_value(&sp).map_err(|_| std::fmt::Error::default())?,
      | None => JsValue::NULL,
    };
    let result = self.enter.call2(&heading_js, &heading_js, &sourcepos_js);
    if let Ok(js) = result {
      if let Some(s) = js.as_string() {
        return out.write_str(&s);
      }
    }
    Ok(())
  }

  fn exit(
    &self,
    out: &mut dyn std::fmt::Write,
    heading: &HeadingMeta,
  ) -> std::fmt::Result {
    let heading_js =
      to_value(&heading).map_err(|_| std::fmt::Error::default())?;
    let result = self.exit.call1(&heading_js, &heading_js);
    if let Ok(js) = result {
      if let Some(s) = js.as_string() {
        return out.write_str(&s);
      }
    }
    Ok(())
  }
}

impl<'p> From<HeadingAdapter> for &'p dyn ComrakHeadingAdapter {
  fn from(adapter: HeadingAdapter) -> Self {
    Box::leak(Box::new(adapter)) as &'p dyn ComrakHeadingAdapter
  }
}

/// The `BrokenLinkCallback` API allows you to handle broken links found by
/// Comrak while parsing a Markdown document. You can leverage this API via the
/// {@linkcode Options.parse.brokenLinkCallback} option.
////
/// It exposes its inner `resolve` function as well as a `call` method to
/// invoke it directly, which is rarely used outside of testing and other
/// advanced use cases. The `call` signature mirrors that of the native
/// `Function.prototype.call` method in JavaScript, accepting a custom `this`
/// binding for its first argument, followed by the broken link reference.
#[wasm_bindgen]
#[derive(Default, Debug, Clone)]
pub struct BrokenLinkCallback {
  resolve: Function,
}

unsafe impl Send for BrokenLinkCallback {}
unsafe impl Sync for BrokenLinkCallback {}

#[wasm_bindgen]
impl BrokenLinkCallback {
  #[wasm_bindgen(constructor)]
  pub fn new(
    #[wasm_bindgen(unchecked_param_type = r"BrokenLinkCallbackFunction")]
    resolve: Function,
  ) -> Self {
    Self { resolve }
  }

  #[wasm_bindgen(getter = resolve, unchecked_return_type = "BrokenLinkCallbackFunction")]
  pub fn get_resolve(&self) -> Function {
    self.resolve.clone()
  }

  #[wasm_bindgen(setter = resolve)]
  pub fn set_resolve(&mut self, resolve: Function) {
    self.resolve = resolve;
  }

  #[wasm_bindgen(unchecked_return_type = "Option<ResolvedReference>")]
  pub fn call(
    &self,
    #[wasm_bindgen(js_name = "thisArg")]
    this: JsValue,
    #[wasm_bindgen(unchecked_param_type = "BrokenLinkReference")]
    reference: JsValue,
  ) -> Result<JsValue, JsValue> {
    self.resolve.call1(&this, &reference)
  }
}

impl ComrakBrokenLinkCallback for BrokenLinkCallback {
  fn resolve(
    &self,
    reference: BrokenLinkReference,
  ) -> Option<ResolvedReference> {
    let r#ref = to_value(&reference)
      .map_err(|_| JsValue::NULL)
      .unwrap_or(JsValue::NULL);
    if r#ref.is_null() || r#ref.is_undefined() {
      return None;
    }
    let result = self.resolve.call1(&r#ref, &r#ref);
    if let Ok(js) = result {
      if js.is_undefined() || js.is_null() || !js.is_object() {
        return None;
      }
      let resolved: ResolvedReference = from_value(js)
        .map_err(|_| JsValue::NULL)
        .unwrap_or_else(|_| ResolvedReference {
          url:   "".to_string(),
          title: "".to_string(),
        });
      return Some(resolved);
    }
    None
  }
}

/// The `URLRewriter` API allows you to rewrite the URLs of links and images
/// being converted from Markdown to HTML by Comrak. You can leverage this API
/// via the option {@linkcode ExtensionOptions.linkURLRewriter} (for links) or
/// {@linkcode ExtensionOptions.imageURLRewriter} (for images).
///
/// The `call` signature mirrors that of the native `Function.prototype.call`
/// method in JavaScript, accepting a custom `this` binding for its first
/// argument, followed by the URL string to rewrite.
#[wasm_bindgen]
#[derive(Default, Debug, Clone)]
pub struct URLRewriter {
  rewriter: Function,
}

#[wasm_bindgen]
impl URLRewriter {
  #[wasm_bindgen(constructor)]
  pub fn new(
    #[wasm_bindgen(unchecked_param_type = "URLRewriterFunction")]
    rewriter: Function,
  ) -> Self {
    Self { rewriter }
  }

  #[wasm_bindgen(getter = rewriter, unchecked_return_type = "URLRewriterFunction")]
  pub fn get_rewriter(&self) -> Function {
    self.rewriter.clone()
  }

  #[wasm_bindgen(setter = rewriter)]
  pub fn set_rewriter(&mut self, rewriter: Function) {
    self.rewriter = rewriter;
  }

  #[wasm_bindgen(unchecked_return_type = "string")]
  pub fn call(
    &self,
    #[wasm_bindgen(js_name = "thisArg")] this: JsValue,
    #[wasm_bindgen(unchecked_param_type = "string")] url: &str,
  ) -> Result<JsValue, JsValue> {
    let url_js = JsValue::from_str(url);
    self.rewriter.call1(&this, &url_js)
  }
}

unsafe impl Send for URLRewriter {}
unsafe impl Sync for URLRewriter {}

impl ComrakURLRewriter for URLRewriter {
  fn to_html(&self, url: &str) -> String {
    if let Ok(js) = self.call(JsValue::NULL, url) {
      if js.is_undefined() || js.is_null() {
        return url.to_string();
      }
      if let Some(s) = js.as_string() {
        return s;
      }
    }
    url.to_string()
  }
}

macro_rules! collect_options {
  (
    $options:ident,
    $broken_link_callback:expr,
    $image_url_rewriter:expr,
    $link_url_rewriter:expr $(,)?
  ) => {
    if let Some(cb) = $broken_link_callback {
      $options.parse.broken_link_callback =
        Some(Arc::new(BrokenLinkCallback::new(cb)));
    }
    if let Some(rw) = $image_url_rewriter {
      $options.extension.image_url_rewriter =
        Some(Arc::new(URLRewriter::new(rw)));
    }
    if let Some(rw) = $link_url_rewriter {
      $options.extension.link_url_rewriter =
        Some(Arc::new(URLRewriter::new(rw)));
    }
  };
}
macro_rules! collect_plugins {
  (
    $plugins:ident,
    $codefence_syntax_highlighter:expr,
    $heading_adapter:expr $(,)?
  ) => {
    if let Some(a) = $codefence_syntax_highlighter {
      $plugins.render.codefence_syntax_highlighter = Some(a.into());
    }
    if let Some(a) = $heading_adapter {
      $plugins.render.heading_adapter = Some(a.into());
    }
  };
}
macro_rules! markdown_to_fn {
  () => {}; // end of recursion

  (
    $(#[$meta:meta])*
    $_:vis fn $id:ident -> $fn:ident;
    $($($rest:tt)+)?
  ) => {
    $(#[$meta])*
    #[wasm_bindgen]
    pub fn $id(
      md: &str,
      #[wasm_bindgen(unchecked_param_type = "Option<Options>")]
      options: Option<Object>,
      #[wasm_bindgen(unchecked_param_type = "Option<SyntaxHighlighterAdapter>")]
      codefence_syntax_highlighter: Option<SyntaxHighlighterAdapter>,
      #[wasm_bindgen(unchecked_param_type = "Option<HeadingAdapter>")]
      heading_adapter: Option<HeadingAdapter>,
      #[wasm_bindgen(unchecked_param_type = "Option<BrokenLinkCallbackFunction>")]
      broken_link_callback: Option<Function>,
      #[wasm_bindgen(unchecked_param_type = "Option<URLRewriterFunction>")]
      image_url_rewriter: Option<Function>,
      #[wasm_bindgen(unchecked_param_type = "Option<URLRewriterFunction>")]
      link_url_rewriter: Option<Function>,
    ) -> Result<String, JsValue> {
      let mut options: ComrakOptions = unwrap_option_object(options)?;
      collect_options!(
        options,
        broken_link_callback,
        image_url_rewriter,
        link_url_rewriter,
      );
      let mut plugins = Plugins::default();
      collect_plugins!(
        plugins,
        codefence_syntax_highlighter,
        heading_adapter,
      );
      let arena = Arena::new();
      let ast = comrak::parse_document(&arena, md, &options);
      let mut out = String::new();
      comrak::$fn(ast, &options, &mut out, &plugins).map_err(map_err)?;
      Ok(out)
    }

    $(markdown_to_fn! { $($rest)+ })?
  };
}
macro_rules! format_fn {
  () => {}; // end of recursion

  (
    $(#[$meta:meta])*
    $_:vis fn $id:ident -> $fn:ident;
    $($($rest:tt)+)?
  ) => {
    $(#[$meta])*
    #[wasm_bindgen]
    pub fn $id(
      #[wasm_bindgen(unchecked_param_type = "AST")]
      ast: Object,
      #[wasm_bindgen(unchecked_param_type = "Option<Options>")]
      options: Option<Object>,
      #[wasm_bindgen(unchecked_param_type = "Option<SyntaxHighlighterAdapter>")]
      codefence_syntax_highlighter: Option<SyntaxHighlighterAdapter>,
      #[wasm_bindgen(unchecked_param_type = "Option<HeadingAdapter>")]
      heading_adapter: Option<HeadingAdapter>,
      #[wasm_bindgen(unchecked_param_type = "Option<BrokenLinkCallbackFunction>")]
      broken_link_callback: Option<Function>,
      #[wasm_bindgen(unchecked_param_type = "Option<URLRewriterFunction>")]
      image_url_rewriter: Option<Function>,
      #[wasm_bindgen(unchecked_param_type = "Option<URLRewriterFunction>")]
      link_url_rewriter: Option<Function>,
    ) -> Result<String, JsValue> {
      let mut options: ComrakOptions = unwrap_option_object(options)?;
      collect_options!(
        options,
        broken_link_callback,
        image_url_rewriter,
        link_url_rewriter,
      );
      let mut plugins = Plugins::default();
      collect_plugins!(
        plugins,
        codefence_syntax_highlighter,
        heading_adapter,
      );
      let mut out = String::new();
      let root: &AstNode = from_value(ast.into()).map_err(map_err)?;
      comrak::$fn(root, &options, &mut out, &plugins).map_err(map_err)?;
      Ok(out)
    }

    $(format_fn! { $($rest)+ })?
  };
}

fn map_err<T: ToString>(e: T) -> JsValue {
  TypeError::new(&e.to_string()).into()
}

fn unwrap_option_object<T: for<'de> Deserialize<'de> + Default>(
  obj: Option<Object>,
) -> Result<T, JsValue> {
  if let Some(o) = obj {
    if o.is_undefined() || o.is_null() || !o.is_object() {
      Ok(T::default())
    } else {
      from_value(o.into()).map_err(map_err)
    }
  } else {
    Ok(T::default())
  }
}


/// Returns the version of Comrak used in this build, as a string.
#[wasm_bindgen]
pub fn version() -> String {
  comrak::version().to_string()
}

/// Parses the given markdown text and returns the AST as a structured object.
#[wasm_bindgen(unchecked_return_type = "AST")]
pub fn parse_document(
  md: &str,
  #[wasm_bindgen(unchecked_param_type = "Option<Options>")] options: Option<
    Object,
  >,
  #[wasm_bindgen(unchecked_param_type = "Option<BrokenLinkCallbackFunction>")]
  broken_link_callback: Option<Function>,
  #[wasm_bindgen(unchecked_param_type = "Option<URLRewriterFunction>")]
  image_url_rewriter: Option<Function>,
  #[wasm_bindgen(unchecked_param_type = "Option<URLRewriterFunction>")]
  link_url_rewriter: Option<Function>,
) -> Result<JsValue, JsValue> {
  let mut options: ComrakOptions = unwrap_option_object(options)?;
  collect_options!(
    options,
    broken_link_callback,
    image_url_rewriter,
    link_url_rewriter,
  );
  let arena = Arena::new();
  let root = comrak::parse_document(&arena, md, &options);
  to_value(&root).map_err(map_err)
}

markdown_to_fn! {
  /// Render Markdown to HTML using plugins.
  ////
  /// See the documentation of the crate root for an example.
  pub fn markdown_to_html -> format_html_with_plugins;

  /// Render Markdown to XML using plugins.
  ///
  /// See the documentation of the crate root for an example.
  pub fn markdown_to_xml -> format_xml_with_plugins;

  /// Render Markdown to CommonMark.
  ////
  /// See the documentation of the crate root for an example.
  pub fn markdown_to_commonmark -> format_commonmark_with_plugins;
}

format_fn! {
  /// Format an AST to HTML using plugins.
  ///
  /// See the documentation of the crate root for an example.
  pub fn format_html -> format_html_with_plugins;

  /// Format an AST to XML using plugins.
  ///
  /// See the documentation of the crate root for an example.
  pub fn format_xml -> format_xml_with_plugins;

  /// Format an AST to CommonMark using plugins.
  ///
  /// See the documentation of the crate root for an example.
  pub fn format_commonmark -> format_commonmark_with_plugins;
}
