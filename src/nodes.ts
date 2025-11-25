/**
 * This module provides the type definitions for the abstract syntax tree (AST)
 * produced by parsing a Markdown document using the {@linkcode parseMarkdown}
 * function, including all the specific node types and their associated data.
 *
 * @module nodes
 */

/**
 * Represents a specific line and column position in a source document. This is
 * used by the {@linkcode Sourcepos} type to indicate an exact location within
 * a Markdown document.
 *
 * @category AST
 */
export interface LineColumn {
  /** The line number (1-based). */
  line: number;
  /** The column number (1-based). */
  column: number;
}

/**
 * Represents a span of two {@linkcode LineColumn} positions in a source
 * document, indicating the `start` and `end` of a range.
 *
 * The {@linkcode AST} structure makes use of this type to associate location
 * metadata with individual nodes in the syntax tree, allowing for features
 * such as precise error reporting and code navigation. This type is also used
 * by the `HeadingAdapter` API's `enter` method, which can receive an optional
 * `Sourcepos` argument indicating the location of the heading being rendered.
 *
 * @category AST
 */
export interface Sourcepos {
  /** The starting position of the range. */
  start: LineColumn;
  /** The ending position of the range. */
  end: LineColumn;
}

/**
 * Represents an abstract syntax tree, or "AST", produced by parsing a Markdown
 * document with the {@linkcode parseMarkdown} function.
 *
 * @category Parsing
 */
export interface AST {
  readonly nodes: readonly [] | readonly [root: AST.DocumentNode, ...ASTNode[]];
}

/**
 * The `AST` namespace contains all of the type definitions for nodes in an
 * abstract syntax tree (AST) produced by parsing a Markdown document with the
 * {@linkcode parseMarkdown} function.
 *
 * Note that the familial relationships are represented by integer indices
 * relative to the `nodes` array of the AST, rather than direct references to
 * other nodes. This is for performance and memory efficiency reasons,
 * primarily, but is also a requirement due to the fact that the Comrak engine
 * is implemented in Rust, which has very strict rules around references and
 * ownership.
 *
 * @remarks
 * To reconstruct the tree structure, you will need to use these indices to
 * look up the corresponding nodes in the `nodes` array of the AST.
 *
 * In a future version of this package, such a utility function may be provided
 * to simplify this process. If your use case requires such functionality,
 * please open an issue on the GitHub repository and describe your exact needs.
 *
 * @see {@linkcode parseMarkdown} to produce an AST from a Markdown document.
 * @see {@linkcode ASTNode} for the union type of all AST node types.
 * @category Parsing
 */
export declare namespace AST {
  export {}; // only expose explicitly exported types

  type Resolve<T extends string, V> = V extends never ? T : { [K in T]: V };

  /**
   * Represents the data associated with a specific node in an abstract syntax
   * tree (AST). This includes the type of the node, its content, source
   * position information, and various flags used during parsing and rendering.
   *
   * @template {string} T The string literal type representing the specific
   * kind of node the data belongs to (e.g., "Text", "Heading", "Paragraph").
   * @template [V=never] The value type associated with the node, which varies
   * based on node type. If there is no extra data associated with the value,
   * such as with {@linkcode AST.TextNode} or {@linkcode AST.DocumentNode},
   * this should be `never`, causing its `value` to simply be of type `T`.
   */
  export interface NodeData<T extends string = string, V = never> {
    value: Resolve<T, V>;
    sourcepos: Sourcepos | undefined;
    content: string;
    open: boolean;
    table_visited: boolean;
    last_line_blank: boolean;
    line_offsets: number[];
  }

  /**
   * Generic node interface inherited by all of the more specific node types in
   * an abstract syntax tree (AST).
   */
  // deno-lint-ignore no-explicit-any
  export interface Node<T extends NodeData<any, any> = NodeData<any, any>> {
    previous_sibling?: number | undefined;
    next_sibling?: number | undefined;
    first_child?: number | undefined;
    last_child?: number | undefined;
    parent?: number | undefined;
    data: T;
  }

  export type DocumentData = NodeData<"Document">;
  export interface DocumentNode extends Node<DocumentData> {
    previous_sibling: undefined;
    next_sibling: undefined;
    parent: undefined;
  }

  export type TextData = NodeData<"Text", string>;
  export type TextNode = Node<TextData>;

  export interface Code {
    literal: string;
    info: string;
  }
  export type CodeData = NodeData<"Code", Code>;
  export type CodeNode = Node<CodeData>;

  export type ParagraphData = NodeData<"Paragraph">;
  export type ParagraphNode = Node<ParagraphData>;

  export interface Heading {
    level: number;
    setext: boolean;
    closed: boolean;
  }
  export type HeadingData = NodeData<"Heading", Heading>;
  export type HeadingNode = Node<HeadingData>;

  export type ThematicBreakData = NodeData<"ThematicBreak">;
  export type ThematicBreakNode = Node<ThematicBreakData>;

  export type FrontMatterData = NodeData<"FrontMatter", string>;
  export type FrontMatterNode = Node<FrontMatterData>;

  export type BlockQuoteData = NodeData<"BlockQuote">;
  export type BlockQuoteNode = Node<BlockQuoteData>;

  export type ListType = "Bullet" | "Ordered";
  export type ListDelimType = "Period" | "Paren";
  export interface List {
    list_type: ListType;
    marker_offset: number;
    padding: number;
    start: number;
    delimiter: ListDelimType;
    bullet_char: number;
    tight: boolean;
    is_task_list: boolean;
  }
  export type ListData = NodeData<"List", List>;
  export type ListNode = Node<ListData>;

  export type ItemData = NodeData<"Item", List>;
  export type ItemNode = Node<ItemData>;

  export type DescriptionListData = NodeData<"DescriptionList">;
  export type DescriptionListNode = Node<DescriptionListData>;

  export interface DescriptionItem {
    marker_offset: number;
    padding: number;
    tight: boolean;
  }
  export type DescriptionItemData = NodeData<
    "DescriptionItem",
    DescriptionItem
  >;
  export type DescriptionItemNode = Node<DescriptionItemData>;

  export type DescriptionTermData = NodeData<"DescriptionTerm">;
  export type DescriptionTermNode = Node<DescriptionTermData>;

  export type DescriptionDetailsData = NodeData<"DescriptionDetails">;
  export type DescriptionDetailsNode = Node<DescriptionDetailsData>;

  export interface CodeBlock {
    fenced: boolean;
    fence_char: number;
    fence_length: number;
    fence_offset: number;
    info: string;
    literal: string;
    closed: boolean;
  }
  export type CodeBlockData = NodeData<"CodeBlock", CodeBlock>;
  export type CodeBlockNode = Node<CodeBlockData>;

  export interface HtmlBlock {
    block_type: number;
    literal: string;
  }
  export type HtmlBlockData = NodeData<"HtmlBlock", HtmlBlock>;
  export type HtmlBlockNode = Node<HtmlBlockData>;

  export type TableAlignment = "None" | "Left" | "Center" | "Right";
  export interface Table {
    alignments: TableAlignment[];
    num_columns: number;
    num_rows: number;
    num_nonempty_cells: number;
  }
  export type TableData = NodeData<"Table", Table>;
  export type TableNode = Node<TableData>;

  export type TableRow = boolean;
  export type TableRowData = NodeData<"TableRow", TableRow>;
  export type TableRowNode = Node<TableRowData>;

  export type TableCellData = NodeData<"TableCell">;
  export type TableCellNode = Node<TableCellData>;

  export type TaskItem = string | null;
  export type TaskItemData = NodeData<"TaskItem", TaskItem>;
  export type TaskItemNode = Node<TaskItemData>;

  export type SoftBreakData = NodeData<"SoftBreak">;
  export type SoftBreakNode = Node<SoftBreakData>;

  export type LineBreakData = NodeData<"LineBreak">;
  export type LineBreakNode = Node<LineBreakData>;

  export type HtmlInline = string;
  export type HtmlInlineData = NodeData<"HtmlInline", HtmlInline>;
  export type HtmlInlineNode = Node<HtmlInlineData>;

  export type Raw = string;
  export type RawData = NodeData<"Raw", Raw>;
  export type RawNode = Node<RawData>;

  export type EmphData = NodeData<"Emph">;
  export type EmphNode = Node<EmphData>;

  export type StrongData = NodeData<"Strong">;
  export type StrongNode = Node<StrongData>;

  export type StrikethroughData = NodeData<"Strikethrough">;
  export type StrikethroughNode = Node<StrikethroughData>;

  export type SuperscriptData = NodeData<"Superscript">;
  export type SuperscriptNode = Node<SuperscriptData>;

  export interface Link {
    url: string;
    title: string;
  }
  export type LinkData = NodeData<"Link", Link>;
  export type LinkNode = Node<LinkData>;

  export interface Image {
    url: string;
    title: string;
  }
  export type ImageData = NodeData<"Image", Image>;
  export type ImageNode = Node<ImageData>;

  export interface FootnoteDefinition {
    name: string;
    total_references: number;
  }
  export type FootnoteDefinitionData = NodeData<
    "FootnoteDefinition",
    FootnoteDefinition
  >;
  export type FootnoteDefinitionNode = Node<FootnoteDefinitionData>;

  export interface FootnoteReference {
    name: string;
    ref_num: number;
    ix: number;
  }
  export type FootnoteReferenceData = NodeData<
    "FootnoteReference",
    FootnoteReference
  >;
  export type FootnoteReferenceNode = Node<FootnoteReferenceData>;

  export interface ShortCode {
    code: string;
    emoji: string;
  }
  export type ShortCodeData = NodeData<"ShortCode", ShortCode>;
  export type ShortCodeNode = Node<ShortCodeData>;

  export interface Math {
    dollar_math: boolean;
    display_math: boolean;
    literal: string;
  }
  export type MathData = NodeData<"Math", Math>;
  export type MathNode = Node<MathData>;

  export interface MultilineBlockQuote {
    fence_length: number;
    fence_offset: number;
  }
  export type MultilineBlockQuoteData = NodeData<
    "MultilineBlockQuote",
    MultilineBlockQuote
  >;
  export type MultilineBlockQuoteNode = Node<MultilineBlockQuoteData>;

  export type EscapedData = NodeData<"Escaped">;
  export type EscapedNode = Node<EscapedData>;

  export interface WikiLink {
    url: string;
  }
  export type WikiLinkData = NodeData<"WikiLink", WikiLink>;
  export type WikiLinkNode = Node<WikiLinkData>;

  export type UnderlineData = NodeData<"Underline">;
  export type UnderlineNode = Node<UnderlineData>;

  export type SubscriptData = NodeData<"Subscript">;
  export type SubscriptNode = Node<SubscriptData>;

  export type SpoileredTextData = NodeData<"SpoileredText">;
  export type SpoileredTextNode = Node<SpoileredTextData>;

  export type EscapedTag = string;
  export type EscapedTagData = NodeData<"EscapedTag", EscapedTag>;
  export type EscapedTagNode = Node<EscapedTagData>;

  export type AlertType = "Note" | "Tip" | "Important" | "Warning" | "Caution";
  export interface Alert {
    alert_type: AlertType;
    title: string | null;
    multiline: boolean;
    fence_length: number;
    fence_offset: number;
  }
  export type AlertData = NodeData<"Alert", Alert>;
  export type AlertNode = Node<AlertData>;

  export type SubtextData = NodeData<"Subtext">;
  export type SubtextNode = Node<SubtextData>;

  /**
   * A union type of all possible {@linkcode AST.Node} subtypes found in a parsed
   * {@linkcode AST} document. These types can be discriminated by examining the
   * `data.value` property of each node.
   *
   * @see {@linkcode AST} for the structure of the abstract syntax tree.
   * @see {@linkcode parseMarkdown} to produce an AST from a Markdown document.
   * @see {@linkcode renderHTML} and {@linkcode renderXML} to render an AST to
   *      an HTML or CommonMark XML document.
   * @see {@linkcode renderCommonMark} to render an AST to a CommonMark document.
   * @category Parsing
   */
  export type NodeType =
    | DocumentNode
    | TextNode
    | CodeNode
    | CodeBlockNode
    | BlockQuoteNode
    | ListNode
    | ItemNode
    | DescriptionListNode
    | DescriptionItemNode
    | DescriptionTermNode
    | DescriptionDetailsNode
    | ParagraphNode
    | HeadingNode
    | ThematicBreakNode
    | FrontMatterNode
    | HtmlBlockNode
    | FootnoteDefinitionNode
    | TableNode
    | TableRowNode
    | TableCellNode
    | TaskItemNode
    | SoftBreakNode
    | LineBreakNode
    | HtmlInlineNode
    | RawNode
    | EmphNode
    | StrongNode
    | StrikethroughNode
    | SuperscriptNode
    | LinkNode
    | ImageNode
    | FootnoteReferenceNode
    | ShortCodeNode
    | MathNode
    | MultilineBlockQuoteNode
    | EscapedNode
    | WikiLinkNode
    | UnderlineNode
    | SubscriptNode
    | SpoileredTextNode
    | EscapedTagNode
    | AlertNode
    | SubtextNode;
}

/**
 * Represents any node in an abstract syntax tree (AST) produced by parsing a
 * Markdown document with the {@linkcode parseMarkdown} function.
 *
 * @see {@linkcode AST} for the structure of the abstract syntax tree.
 * @see {@linkcode parseMarkdown} to produce an AST from a Markdown document.
 * @see {@linkcode renderHTML} and {@linkcode renderXML} to render an AST to
 *      an HTML or CommonMark XML document.
 * @see {@linkcode renderCommonMark} to render an AST to a CommonMark document.
 * @category Parsing
 */
export type ASTNode = AST.NodeType;
