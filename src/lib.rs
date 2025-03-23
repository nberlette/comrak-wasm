use comrak::{
  ComrakExtensionOptions,
  ComrakOptions,
  ComrakParseOptions,
  ComrakRenderOptions,
};
use js_sys::TypeError;
use serde::Deserialize;
use serde_wasm_bindgen::from_value;
use wasm_bindgen::prelude::*;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
#[cfg(feature = "alloc")]
static ALLOC: lol_alloc::WeeAlloc = lol_alloc::WeeAlloc::INIT;

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
  parse_default_into_string: Option<String>,
  parse_smart: bool,
  render_escape: bool,
  render_github_pre_lang: bool,
  render_hardbreaks: bool,
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
      parse_default_into_string: None,
      parse_smart: true,
      render_escape: true,
      render_github_pre_lang: true,
      render_hardbreaks: false,
      render_unsafe: false,
      render_width: 80,
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
  parse_default_into_string?: string;
  parse_smart: boolean;
  render_escape: boolean;
  render_github_pre_lang: boolean;
  render_hardbreaks: boolean;
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
      default_info_string: opts.parse_default_into_string,
      smart: opts.parse_smart,
    },
    render: ComrakRenderOptions {
      escape: opts.render_escape,
      github_pre_lang: opts.render_github_pre_lang,
      hardbreaks: opts.render_hardbreaks,
      unsafe_: opts.render_unsafe,
      width: opts.render_width,
    },
  };
  let html = comrak::markdown_to_html(md, &opts);
  Ok(html)
}
