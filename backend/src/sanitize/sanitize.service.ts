import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { HTML_POLICY, MAX_TITLE_LENGTH, TEXT_ONLY_POLICY } from './sanitize.policy.js';

export interface ProcessedHtml {
  /** Safe to store and to render with dangerouslySetInnerHTML. */
  html: string;
  /** Plain text for the search index. Never rendered as HTML. */
  text: string;
}

@Injectable()
export class SanitizeService {
  /** Rebuild untrusted HTML from the allowlist in sanitize.policy.ts. */
  html(raw: string): string {
    return sanitizeHtml(raw, HTML_POLICY);
  }

  /** Titles are text only: all tags removed, whitespace collapsed, length capped. */
  title(raw: string): string {
    const stripped = sanitizeHtml(raw, TEXT_ONLY_POLICY);
    return this.collapse(this.decode(stripped)).slice(0, MAX_TITLE_LENGTH);
  }

  /**
   * Plain text of ALREADY-SANITIZED html. Tags become spaces so that
   * "<p>one</p><p>two</p>" is "one two", not "onetwo". Because the input has
   * been through html(), attribute values have < > & escaped, so stripping
   * with a simple tag pattern is safe here.
   */
  toPlainText(cleanHtml: string): string {
    return this.collapse(this.decode(cleanHtml.replace(/<[^>]*>/g, ' ')));
  }

  /** Sanitize once, derive the index text from the sanitized result. */
  process(rawHtml: string): ProcessedHtml {
    const html = this.html(rawHtml);
    return { html, text: this.toPlainText(html) };
  }

  // sanitize-html only ever emits these entities in text; &amp; must go last.
  private decode(s: string): string {
    return s
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
  }

  private collapse(s: string): string {
    return s.replace(/\s+/g, ' ').trim();
  }
}
