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
  parse_default_info_string: Option<String>,
  parse_smart: bool,
  parse_relaxed_tasklist_matching: bool,
  render_escape: bool,
  render_full_info_string: bool,
  render_github_pre_lang: bool,
  render_hardbreaks: bool,
  #[serde(default, with = "ListStyleType")]
  render_list_style: ComrakListStyleType,
  render_unsafe: bool,
  render_width: usize,
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
      parse_relaxed_tasklist_matching: false,
      parse_default_info_string: None,
      parse_smart: true,
      render_escape: true,
      render_github_pre_lang: true,
      render_hardbreaks: false,
      render_unsafe: false,
      render_width: 80,
      render_list_style: Default::default(),
      render_full_info_string: false,
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
  parse_default_info_string?: string;
  parse_smart: boolean;
  parse_relaxed_tasklist_matching?: boolean;
  render_escape: boolean;
  render_full_info_string?: boolean;
  render_github_pre_lang: boolean;
  render_hardbreaks: boolean;
  render_list_style?: "dash" | "plus" | "star";
  render_unsafe: boolean;
  render_width: number;
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
    },
    parse: ComrakParseOptions {
      default_info_string: opts.parse_default_info_string,
      smart: opts.parse_smart,
      relaxed_tasklist_matching: opts.parse_relaxed_tasklist_matching,
    },
    render: ComrakRenderOptions {
      escape: opts.render_escape,
      github_pre_lang: opts.render_github_pre_lang,
      hardbreaks: opts.render_hardbreaks,
      unsafe_: opts.render_unsafe,
      width: opts.render_width,
      full_info_string: opts.render_full_info_string,
      list_style: opts.render_list_style,
    },
  };
  let html = comrak::markdown_to_html(md, &opts);
  Ok(html)
}
