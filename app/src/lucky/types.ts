// Shape of topics.json, written by scripts/lucky-topics.mjs from the chrome-demo cloud.

export type PathId = 'ecommerce' | 'blog' | 'doc';

export interface Section {
  heading: string;
  text: string;
  /** Assets in the cloud that this section's words match. */
  matches: number;
}

export interface Topic {
  id: string;
  title: string;
  /** E-commerce only: the product description sentence. */
  description?: string;
  /** Blog post (2-3) and document (3) only. */
  sections?: Section[];
  /** Assets in the cloud that the title matches. */
  matches: number;
}

export interface TopicsFile {
  cloud: string;
  generatedAt: string;
  paths: Record<PathId, Topic[]>;
}
