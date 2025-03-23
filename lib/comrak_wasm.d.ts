// @generated file from wasmbuild -- do not edit
// deno-lint-ignore-file
// deno-fmt-ignore-file

export function markdown_to_html(md: string, opts: Options): string;

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
