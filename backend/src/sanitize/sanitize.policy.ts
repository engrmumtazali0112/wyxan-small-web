import sanitizeHtml from 'sanitize-html';
import { isValidAddress, normalizeAddress } from '../common/address.js';

/**
 * THE CONTAINMENT POLICY. This file is the single place that decides what a
 * stranger's HTML is allowed to contain. Everything not listed here is removed.
 *
 * Approach: allowlist, not blocklist. We never try to recognise "bad" markup;
 * we rebuild the page from a short list of known-safe tags and attributes.
 *
 * What it costs authors (say this in the walkthrough):
 *  - no scripts, event handlers, iframes, forms, svg/math, images, media
 *  - no class / id attributes (so a page can't target or impersonate our UI)
 *  - only a handful of inline styles (colour, alignment, weight), and never
 *    positioning, sizing or url(), so a page can't cover the address bar
 *  - links only work if they point at a valid address like "tidepool.zz"
 */

// Size limits (enforced again by the DTO in the Sites module).
export const MAX_HTML_LENGTH = 50_000;
export const MAX_TITLE_LENGTH = 120;

export const ALLOWED_TAGS = [
  // headings + text blocks
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'pre',
  // inline text
  'a', 'abbr', 'b', 'strong', 'i', 'em', 'u', 's', 'small', 'sub', 'sup',
  'mark', 'code', 'kbd', 'samp', 'cite', 'q', 'time', 'span',
  // lists + definitions
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // tables
  'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  // plain structure
  'div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  'figure', 'figcaption', 'details', 'summary',
];

// Tags whose contents are dropped entirely (not just the tag), so script
// bodies, CSS and svg text never leak into the page or the search index.
export const NON_TEXT_TAGS = [
  'script', 'style', 'textarea', 'option', 'noscript', 'template',
  'title', 'svg', 'math', 'iframe', 'object', 'embed',
];

const SAFE_COLOR = [
  /^#[0-9a-f]{3,8}$/i,
  /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i,
  /^[a-z]{3,20}$/i, // named colours; anything with "(" such as url() can't match
];

export const HTML_POLICY: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  nonTextTags: NON_TEXT_TAGS,
  disallowedTagsMode: 'discard',

  // No class, no id, no data-*, no on* handlers: only these.
  allowedAttributes: {
    a: ['href', 'title'],
    '*': ['title', 'lang', 'style'],
  },

  // Inline style is limited to look-only properties with strictly matched values.
  allowedStyles: {
    '*': {
      color: SAFE_COLOR,
      'background-color': SAFE_COLOR,
      'text-align': [/^(left|right|center|justify)$/],
      'font-weight': [/^(normal|bold|[1-9]00)$/],
      'font-style': [/^(normal|italic)$/],
      'text-decoration': [/^(none|underline|line-through)$/],
    },
  },

  // No URL schemes at all: javascript:, data:, http(s):, mailto: are all refused.
  // The only thing a link may hold is a bare address, enforced in the transform below.
  allowedSchemes: [],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,

  transformTags: {
    a: (tagName, attribs) => {
      const next: Record<string, string> = {};
      if (attribs.title) next.title = attribs.title;
      // A link survives only if it points at a valid address; it is rewritten
      // to the normalised form. Anything else becomes a plain, inert <a>.
      if (attribs.href && isValidAddress(attribs.href)) {
        next.href = normalizeAddress(attribs.href);
      }
      return { tagName, attribs: next };
    },
  },
};

// Used for titles: strip every tag, keep text only.
export const TEXT_ONLY_POLICY: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  nonTextTags: NON_TEXT_TAGS,
};
