#![cfg(target_arch = "wasm32")]

use comrak::{
  ComrakExtensionOptions,
  ComrakOptions,
  ComrakParseOptions,
  ComrakRenderOptions,
  ListStyleType as ComrakListStyleType,
};
use js_sys::TypeError;
use serde::Deserialize;
use serde_wasm_bindgen::from_value;
use wasm_bindgen::prelude::*;

#[cfg(feature = "alloc")]
extern crate alloc;
#[cfg(all(feature = "alloc", not(feature = "mt")))]
use lol_alloc::AssumeSingleThreaded;
#[cfg(feature = "alloc")]
use lol_alloc::FreeListAllocator;
#[cfg(all(feature = "alloc", feature = "mt"))]
use lol_alloc::LockedAllocator;

#[global_allocator]
#[cfg(all(feature = "alloc", not(feature = "mt")))]
// SAFETY: This app is single threaded, so AssumeSingleThreaded is allowed.
static ALLOCATOR: AssumeSingleThreaded<FreeListAllocator> =
  unsafe { AssumeSingleThreaded::new(FreeListAllocator::new()) };

#[global_allocator]
#[cfg(all(feature = "alloc", feature = "mt"))]
static ALLOCATOR: LockedAllocator<FreeListAllocator> =
  LockedAllocator::new(FreeListAllocator::new());

#[derive(Deserialize, Debug, Clone, Copy, Default)]
#[serde(remote = "ComrakListStyleType", rename_all = "lowercase")]
pub enum ListStyleType {
  /// The `-` character
  #[default]
  Dash = 45,
  /// The `+` character
  Plus = 43,
  /// The `*` character
  Star = 42,
}

#[derive(Deserialize, Debug, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum WikiLinksTitle {
  Before,
  After,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct ExtensionOptions {
  autolink: bool,
  description_lists: bool,
  footnotes: bool,
  front_matter_delimiter: Option<String>,
  #[serde(rename = "headerIDs")]
  header_ids: Option<String>,
  strikethrough: bool,
  superscript: bool,
  table: bool,
  tagfilter: bool,
  tasklist: bool,
  multiline_block_quotes: bool,
  alerts: bool,
  math_dollars: bool,
  math_code: bool,
  wikilinks_title: Option<WikiLinksTitle>,
  underline: bool,
  subscript: bool,
  spoiler: bool,
  greentext: bool,
  cjk_friendly_emphasis: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct ParseOptions {
  default_info_string: Option<String>,
  smart: bool,
  relaxed_tasklist_matching: bool,
  relaxed_autolinks: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct RenderOptions {
  escape: bool,
  full_info_string: bool,
  github_pre_lang: bool,
  hardbreaks: bool,
  #[serde(default, with = "ListStyleType")]
  list_style: ComrakListStyleType,
  #[serde(rename = "unsafe")]
  unsafe_: bool,
  width: usize,
  sourcepos: bool,
  escaped_char_spans: bool,
  ignore_setext: bool,
  ignore_empty_links: bool,
  gfm_quirks: bool,
  prefer_fenced: bool,
  figure_with_caption: bool,
  tasklist_classes: bool,
  ol_width: usize,
  experimental_minimize_commonmark: bool,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct Options {
  extension: ExtensionOptions,
  parse: ParseOptions,
  render: RenderOptions,
}

impl Default for ExtensionOptions {
  fn default() -> Self {
    Self {
      autolink: true,
      description_lists: true,
      footnotes: true,
      front_matter_delimiter: None,
      header_ids: None,
      strikethrough: true,
      superscript: true,
      table: true,
      tagfilter: true,
      tasklist: true,
      multiline_block_quotes: false,
      alerts: false,
      math_dollars: false,
      math_code: false,
      wikilinks_title: None,
      underline: false,
      subscript: false,
      spoiler: false,
      greentext: false,
      cjk_friendly_emphasis: false,
    }
  }
}

impl Default for ParseOptions {
  fn default() -> Self {
    Self {
      default_info_string: None,
      smart: true,
      relaxed_tasklist_matching: false,
      relaxed_autolinks: false,
    }
  }
}

impl Default for RenderOptions {
  fn default() -> Self {
    Self {
      escape: true,
      full_info_string: false,
      github_pre_lang: true,
      hardbreaks: false,
      list_style: Default::default(),
      unsafe_: false,
      width: 80,
      sourcepos: false,
      escaped_char_spans: false,
      ignore_setext: false,
      ignore_empty_links: false,
      gfm_quirks: false,
      prefer_fenced: false,
      figure_with_caption: false,
      tasklist_classes: false,
      ol_width: 0,
      experimental_minimize_commonmark: false,
    }
  }
}

#[wasm_bindgen]
pub fn markdown_to_html(
  md: &str,
  #[wasm_bindgen(unchecked_param_type = "ComrakOptions")] opts: JsValue,
) -> Result<String, JsValue> {
  let opts: Options =
    from_value(opts.clone()).map_err(|err| TypeError::new(&err.to_string()))?;
  
  let (wikilinks_title_after_pipe, wikilinks_title_before_pipe) = match opts.extension.wikilinks_title {
    Some(WikiLinksTitle::After) => (true, false),
    Some(WikiLinksTitle::Before) => (false, true),
    None => (false, false),
  };

  let comrak_opts = ComrakOptions {
    extension: ComrakExtensionOptions {
      autolink: opts.extension.autolink,
      description_lists: opts.extension.description_lists,
      footnotes: opts.extension.footnotes,
      front_matter_delimiter: opts.extension.front_matter_delimiter,
      header_ids: opts.extension.header_ids,
      strikethrough: opts.extension.strikethrough,
      superscript: opts.extension.superscript,
      table: opts.extension.table,
      tagfilter: opts.extension.tagfilter,
      tasklist: opts.extension.tasklist,
      multiline_block_quotes: opts.extension.multiline_block_quotes,
      alerts: opts.extension.alerts,
      math_dollars: opts.extension.math_dollars,
      math_code: opts.extension.math_code,
      wikilinks_title_after_pipe,
      wikilinks_title_before_pipe,
      underline: opts.extension.underline,
      subscript: opts.extension.subscript,
      spoiler: opts.extension.spoiler,
      greentext: opts.extension.greentext,
      cjk_friendly_emphasis: opts.extension.cjk_friendly_emphasis,
      image_url_rewriter: None,
      link_url_rewriter: None,
      #[cfg(feature = "shortcodes")]
      shortcodes: false,
    },
    parse: ComrakParseOptions {
      default_info_string: opts.parse.default_info_string,
      smart: opts.parse.smart,
      relaxed_tasklist_matching: opts.parse.relaxed_tasklist_matching,
      relaxed_autolinks: opts.parse.relaxed_autolinks,
      broken_link_callback: None,
    },
    render: ComrakRenderOptions {
      escape: opts.render.escape,
      github_pre_lang: opts.render.github_pre_lang,
      hardbreaks: opts.render.hardbreaks,
      unsafe_: opts.render.unsafe_,
      width: opts.render.width,
      full_info_string: opts.render.full_info_string,
      list_style: opts.render.list_style,
      sourcepos: opts.render.sourcepos,
      escaped_char_spans: opts.render.escaped_char_spans,
      ignore_setext: opts.render.ignore_setext,
      ignore_empty_links: opts.render.ignore_empty_links,
      gfm_quirks: opts.render.gfm_quirks,
      prefer_fenced: opts.render.prefer_fenced,
      figure_with_caption: opts.render.figure_with_caption,
      tasklist_classes: opts.render.tasklist_classes,
      ol_width: opts.render.ol_width,
      experimental_minimize_commonmark: opts.render.experimental_minimize_commonmark,
    },
  };
  let html = comrak::markdown_to_html(md, &comrak_opts);
  Ok(html)
}
