import { describe, it, expect } from 'vitest';
import { SanitizeService } from './sanitize.service.js';

const svc = new SanitizeService();

describe('SanitizeService.html: containing markup we did not write', () => {
  it('removes script tags and their contents', () => {
    const out = svc.html('<p>hi</p><script>alert(1)</script>');
    expect(out).toBe('<p>hi</p>');
  });

  it('removes inline event handlers', () => {
    const out = svc.html('<p onclick="steal()" onmouseover="x()">hi</p>');
    expect(out).toBe('<p>hi</p>');
  });

  it('removes images, iframes, forms, svg and style blocks', () => {
    const out = svc.html(
      '<img src=x onerror=alert(1)><iframe src="http://evil"></iframe>' +
        '<form action="/x"><input name="a"></form><svg onload=alert(1)><text>t</text></svg>' +
        '<style>body{display:none}</style><p>ok</p>',
    );
    expect(out).not.toMatch(/<(img|iframe|form|input|svg|style)/i);
    expect(out).not.toMatch(/onerror|onload|display:none/i);
    expect(out).toContain('<p>ok</p>');
  });

  it('refuses javascript:, data: and http(s) links', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'https://evil.example', '//evil.example']) {
      const out = svc.html(`<a href="${href}">x</a>`);
      expect(out).not.toMatch(/href/i);
      expect(out).not.toMatch(/javascript|evil/i);
    }
  });

  it('keeps links to valid addresses, normalised', () => {
    const out = svc.html('<a href="Tidepool.ZZ" onclick="x()">go</a>');
    expect(out).toContain('href="tidepool.zz"');
    expect(out).not.toMatch(/onclick/i);
  });

  it('keeps links to addresses that do not exist (broken links are allowed)', () => {
    expect(svc.html('<a href="never-existed.zz">x</a>')).toContain('href="never-existed.zz"');
  });

  it('drops class and id so a page cannot target or imitate the browser UI', () => {
    const out = svc.html('<div class="address-bar" id="history-sidebar">x</div>');
    expect(out).toBe('<div>x</div>');
  });

  it('allows look-only styles but never positioning or url()', () => {
    expect(svc.html('<p style="color: red">x</p>')).toMatch(/color:\s*red/);
    const bad = svc.html(
      '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:url(javascript:alert(1))">x</div>',
    );
    expect(bad).toBe('<div>x</div>');
  });

  it('does not let nested/broken tags rebuild a script tag', () => {
    const out = svc.html('<<script>script>alert(1)<</script>/script>');
    expect(out).not.toMatch(/<script/i);
  });
});

describe('SanitizeService.toPlainText / process', () => {
  it('separates block elements and decodes entities', () => {
    const { text } = svc.process('<p>one</p><p>two &amp; three</p>');
    expect(text).toBe('one two & three');
  });

  it('never leaks script bodies into the search index', () => {
    const { text } = svc.process('<p>hello</p><script>secretPayload()</script>');
    expect(text).toBe('hello');
  });

  it('returns sanitized html alongside the text', () => {
    const { html, text } = svc.process('<h1 onclick="x()">Tides</h1>');
    expect(html).toBe('<h1>Tides</h1>');
    expect(text).toBe('Tides');
  });
});

describe('SanitizeService.title', () => {
  it('strips tags and scripts, collapses whitespace', () => {
    expect(svc.title('  <b>Tide</b>  pool <script>x()</script>')).toBe('Tide pool');
  });

  it('caps the length', () => {
    expect(svc.title('a'.repeat(500)).length).toBe(120);
  });
});
