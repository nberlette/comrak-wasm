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

#[derive(Deserialize)]
struct FlatComrakOptions {
  extension_autolink: bool,
  extension_description_lists: bool,
  extension_footnotes: bool,
  #[serde(default)]
  extension_front_matter_delimiter: Option<String>,
  #[serde(default)]
  extension_header_ids: Option<String>,
  extension_strikethrough: bool,
  extension_superscript: bool,
  extension_table: bool,
  extension_tagfilter: bool,
  extension_tasklist: bool,
  #[serde(default)]
  extension_multiline_block_quotes: bool,
  #[serde(default)]
  extension_alerts: bool,
  #[serde(default)]
  extension_math_dollars: bool,
  #[serde(default)]
  extension_math_code: bool,
  #[serde(default)]
  extension_wikilinks_title_after_pipe: bool,
  #[serde(default)]
  extension_wikilinks_title_before_pipe: bool,
  #[serde(default)]
  extension_underline: bool,
  #[serde(default)]
  extension_subscript: bool,
  #[serde(default)]
  extension_spoiler: bool,
  #[serde(default)]
  extension_greentext: bool,
  #[serde(default)]
  extension_cjk_friendly_emphasis: bool,
  #[serde(default)]
  parse_default_info_string: Option<String>,
  parse_smart: bool,
  parse_relaxed_tasklist_matching: bool,
  #[serde(default)]
  parse_relaxed_autolinks: bool,
  render_escape: bool,
  render_full_info_string: bool,
  render_github_pre_lang: bool,
  render_hardbreaks: bool,
  #[serde(default, with = "ListStyleType")]
  render_list_style: ComrakListStyleType,
  render_unsafe: bool,
  render_width: usize,
  #[serde(default)]
  render_sourcepos: bool,
  #[serde(default)]
  render_escaped_char_spans: bool,
  #[serde(default)]
  render_ignore_setext: bool,
  #[serde(default)]
  render_ignore_empty_links: bool,
  #[serde(default)]
  render_gfm_quirks: bool,
  #[serde(default)]
  render_prefer_fenced: bool,
  #[serde(default)]
  render_figure_with_caption: bool,
  #[serde(default)]
  render_tasklist_classes: bool,
  #[serde(default)]
  render_ol_width: usize,
  #[serde(default)]
  render_experimental_minimize_commonmark: bool,
}

impl Default for FlatComrakOptions {
  fn default() -> Self {
    Self {
      extension_autolink: true,
      extension_description_lists: true,
      extension_footnotes: true,
      extension_front_matter_delimiter: None,
      extension_header_ids: None,
      extension_strikethrough: true,
      extension_superscript: true,
      extension_table: true,
      extension_tagfilter: true,
      extension_tasklist: true,
      extension_multiline_block_quotes: false,
      extension_alerts: false,
      extension_math_dollars: false,
      extension_math_code: false,
      extension_wikilinks_title_after_pipe: false,
      extension_wikilinks_title_before_pipe: false,
      extension_underline: false,
      extension_subscript: false,
      extension_spoiler: false,
      extension_greentext: false,
      extension_cjk_friendly_emphasis: false,
      parse_relaxed_tasklist_matching: false,
      parse_default_info_string: None,
      parse_smart: true,
      parse_relaxed_autolinks: false,
      render_escape: true,
      render_github_pre_lang: true,
      render_hardbreaks: false,
      render_unsafe: false,
      render_width: 80,
      render_list_style: Default::default(),
      render_full_info_string: false,
      render_sourcepos: false,
      render_escaped_char_spans: false,
      render_ignore_setext: false,
      render_ignore_empty_links: false,
      render_gfm_quirks: false,
      render_prefer_fenced: false,
      render_figure_with_caption: false,
      render_tasklist_classes: false,
      render_ol_width: 0,
      render_experimental_minimize_commonmark: false,
    }
  }
}

#[wasm_bindgen(typescript_custom_section)]
pub const OPTIONS_TYPE: &'static str = r#"
export interface Options {
  extension_autolink: boolean;
  extension_description_lists: boolean;
  extension_footnotes: boolean;
  extension_front_matter_delimiter?: string;
  extension_header_ids?: string;
  extension_strikethrough: boolean;
  extension_superscript: boolean;
  extension_table: boolean;
  extension_tagfilter: boolean;
  extension_tasklist: boolean;
  extension_multiline_block_quotes?: boolean;
  extension_alerts?: boolean;
  extension_math_dollars?: boolean;
  extension_math_code?: boolean;
  extension_wikilinks_title_after_pipe?: boolean;
  extension_wikilinks_title_before_pipe?: boolean;
  extension_underline?: boolean;
  extension_subscript?: boolean;
  extension_spoiler?: boolean;
  extension_greentext?: boolean;
  extension_cjk_friendly_emphasis?: boolean;
  parse_default_info_string?: string;
  parse_smart: boolean;
  parse_relaxed_tasklist_matching?: boolean;
  parse_relaxed_autolinks?: boolean;
  render_escape: boolean;
  render_full_info_string?: boolean;
  render_github_pre_lang: boolean;
  render_hardbreaks: boolean;
  render_list_style?: "dash" | "plus" | "star";
  render_unsafe: boolean;
  render_width: number;
  render_sourcepos?: boolean;
  render_escaped_char_spans?: boolean;
  render_ignore_setext?: boolean;
  render_ignore_empty_links?: boolean;
  render_gfm_quirks?: boolean;
  render_prefer_fenced?: boolean;
  render_figure_with_caption?: boolean;
  render_tasklist_classes?: boolean;
  render_ol_width?: number;
  render_experimental_minimize_commonmark?: boolean;
}
"#;

#[wasm_bindgen]
pub fn markdown_to_html(
  md: &str,
  #[wasm_bindgen(unchecked_param_type = "Options")] opts: JsValue,
) -> Result<String, JsValue> {
  let opts: FlatComrakOptions =
    from_value(opts.clone()).map_err(|err| TypeError::new(&err.to_string()))?;
  let opts = ComrakOptions {
    extension: ComrakExtensionOptions {
      autolink: opts.extension_autolink,
      description_lists: opts.extension_description_lists,
      footnotes: opts.extension_footnotes,
      front_matter_delimiter: opts.extension_front_matter_delimiter,
      header_ids: opts.extension_header_ids,
      strikethrough: opts.extension_strikethrough,
      superscript: opts.extension_superscript,
      table: opts.extension_table,
      tagfilter: opts.extension_tagfilter,
      tasklist: opts.extension_tasklist,
      multiline_block_quotes: opts.extension_multiline_block_quotes,
      alerts: opts.extension_alerts,
      math_dollars: opts.extension_math_dollars,
      math_code: opts.extension_math_code,
      wikilinks_title_after_pipe: opts.extension_wikilinks_title_after_pipe,
      wikilinks_title_before_pipe: opts.extension_wikilinks_title_before_pipe,
      underline: opts.extension_underline,
      subscript: opts.extension_subscript,
      spoiler: opts.extension_spoiler,
      greentext: opts.extension_greentext,
      cjk_friendly_emphasis: opts.extension_cjk_friendly_emphasis,
      image_url_rewriter: None,
      link_url_rewriter: None,
      #[cfg(feature = "shortcodes")]
      shortcodes: false,
    },
    parse: ComrakParseOptions {
      default_info_string: opts.parse_default_info_string,
      smart: opts.parse_smart,
      relaxed_tasklist_matching: opts.parse_relaxed_tasklist_matching,
      relaxed_autolinks: opts.parse_relaxed_autolinks,
      broken_link_callback: None,
    },
    render: ComrakRenderOptions {
      escape: opts.render_escape,
      github_pre_lang: opts.render_github_pre_lang,
      hardbreaks: opts.render_hardbreaks,
      unsafe_: opts.render_unsafe,
      width: opts.render_width,
      full_info_string: opts.render_full_info_string,
      list_style: opts.render_list_style,
      sourcepos: opts.render_sourcepos,
      escaped_char_spans: opts.render_escaped_char_spans,
      ignore_setext: opts.render_ignore_setext,
      ignore_empty_links: opts.render_ignore_empty_links,
      gfm_quirks: opts.render_gfm_quirks,
      prefer_fenced: opts.render_prefer_fenced,
      figure_with_caption: opts.render_figure_with_caption,
      tasklist_classes: opts.render_tasklist_classes,
      ol_width: opts.render_ol_width,
      experimental_minimize_commonmark: opts.render_experimental_minimize_commonmark,
    },
  };
  let html = comrak::markdown_to_html(md, &opts);
  Ok(html)
}
