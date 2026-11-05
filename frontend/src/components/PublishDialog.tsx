"use client";

import { useEffect, useState, type FormEvent } from "react";
import { publishSite } from "@/lib/api";
import { ADDRESS_RE } from "@/lib/address";
import { useBrowser } from "@/store/browser";

const SAMPLE = `<h1>Hello from my corner</h1>
<p>I wrote this page myself. It mentions <a href="tidepool.zz">the tide pools</a>, and it also links to somewhere that does not exist: <a href="nowhere.zz">nowhere.zz</a>.</p>`;

interface Props {
  userId: string;
  authorName: string;
  onClose: () => void;
}

export default function PublishDialog({ userId, authorName, onClose }: Props) {
  const navigate = useBrowser((s) => s.navigate);
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const addr = address.trim().toLowerCase();
  const addrOk = addr === "" || (addr.length <= 80 && ADDRESS_RE.test(addr));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ADDRESS_RE.test(addr)) {
      setError('Address must look like "tidepool.zz"');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const site = await publishSite({ address: addr, title, html, authorId: userId });
      navigate(site.address, "publish"); // a new navigation: it also truncates forward history
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish");
      setBusy(false);
    }
  }

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="dialog" role="dialog" aria-modal="true" aria-label="Publish a site" onSubmit={submit}>
        <h2>Publish a site</h2>
        <p className="muted">Publishing as {authorName}. Re-publishing your own address replaces the page.</p>

        <label>
          Address
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="my-corner.zz"
            spellCheck={false}
            autoCapitalize="off"
            aria-invalid={!addrOk}
            required
          />
          {!addrOk && <small className="bad">lowercase letters, digits and hyphens, ending in .zz</small>}
        </label>

        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </label>

        <label>
          Page (HTML)
          <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10} spellCheck={false} required />
          <small className="muted">
            Scripts, images, forms and frames are removed; colour is the only styling that survives.
            Links must be bare addresses like <code>tidepool.zz</code>.
          </small>
        </label>

        {error && <p className="bad" role="alert">{error}</p>}

        <div className="dialog__actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? "Publishing…" : "Publish"}
          </button>
        </div>
      </form>
    </div>
  );
}