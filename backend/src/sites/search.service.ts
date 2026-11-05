import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Site, SiteDocument } from './site.schema.js';

export interface SearchHit {
  address: string;
  title: string;
  /** A short excerpt of the page text around the first matching word. */
  snippet: string;
  /** MongoDB textScore: higher is a better match (title matches weigh 10x). */
  score: number;
}

type Row = { address: string; title: string; text: string; score: number };

const SNIPPET_LENGTH = 180;

function makeSnippet(text: string, query: string): string {
  const terms = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const lower = text.toLowerCase();

  // Text search stems words ("tides" finds "tide"), so also try a crude stem.
  let at = -1;
  for (const term of terms) {
    const stem = term.replace(/(ing|ed|es|s)$/, '');
    for (const candidate of new Set([term, stem.length >= 3 ? stem : term])) {
      const i = lower.indexOf(candidate);
      if (i !== -1 && (at === -1 || i < at)) at = i;
    }
  }

  const start = Math.max(0, at === -1 ? 0 : at - 60);
  const slice = text.slice(start, start + SNIPPET_LENGTH);
  return `${start > 0 ? '…' : ''}${slice}${start + SNIPPET_LENGTH < text.length ? '…' : ''}`;
}

@Injectable()
export class SearchService {
  constructor(@InjectModel(Site.name) private readonly siteModel: Model<SiteDocument>) {}

  /**
   * Full-text search across title AND body text, best match first.
   * Uses the "site_text_search" index declared on the Site schema.
   */
  async search(rawQuery: string, limit = 20): Promise<SearchHit[]> {
    const q = rawQuery.trim();
    if (!q) return [];

    const rows = await this.siteModel
      .find({ $text: { $search: q } }, { address: 1, title: 1, text: 1, score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean<Row[]>()
      .exec();

    return rows.map((r) => ({
      address: r.address,
      title: r.title,
      snippet: makeSnippet(r.text, q),
      score: r.score,
    }));
  }
}
