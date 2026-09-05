/**
 * Policy documents are authored as structured blocks rather than raw HTML so
 * every page renders with consistent typography and stays easy to audit when
 * Merchant Center or Stripe asks for a specific clause.
 */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'callout'; title: string; text: string };

export type Section = {
  /** Used as the anchor id and in the on-page table of contents. */
  id: string;
  heading: string;
  blocks: Block[];
};

export type Policy = {
  slug: string;
  title: string;
  /** Shown under the H1 and used as the meta description. */
  summary: string;
  updated: string;
  sections: Section[];
};
