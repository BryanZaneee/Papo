import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SiteContent } from "./types";
import { ApiError, getSite, hasToken, login, putSite, verify } from "./api";
import { thumbUrl } from "./fields";
import { scrollPreview } from "./preview";
import { BioEditor, BookingEditor, EventsEditor, GalleryEditor, HeroEditor, ReleaseEditor, SetsEditor, SocialsEditor } from "./sections";

type ScreenKey = "hero" | "socials" | "bio" | "release" | "events" | "sets" | "gallery" | "booking";
type Screen = "home" | ScreenKey;

// Page order. `anchor` is what the live preview scrolls to — the section's content, not
// the section box (those have ~200px of top padding), so the edit is in view.
const SCREENS: { key: ScreenKey; title: string; blurb: string; anchor: string }[] = [
  { key: "hero", title: "Top of the page", blurb: "Background video, name and tagline", anchor: "" },
  { key: "socials", title: "Social links", blurb: "Instagram, Spotify… shown under the name and in the footer", anchor: ".hero-links" },
  { key: "bio", title: "Biography", blurb: "Portrait photo and bio text", anchor: "#bio .bio-grid" },
  { key: "release", title: "Release & tracks", blurb: "Cover art, blurb and the playable track list", anchor: "#releases .releases-grid" },
  { key: "events", title: "DJ Events", blurb: "The poster wall", anchor: "#archives .archives-head" },
  { key: "sets", title: "DJ sets", blurb: "YouTube videos under the posters", anchor: "#sets" },
  { key: "gallery", title: "Gallery", blurb: "The photo grid", anchor: "#gallery .section-heading" },
  { key: "booking", title: "Booking", blurb: "Email cards at the bottom", anchor: "#book .booking-heading" },
];

function thumbFor(site: SiteContent, key: ScreenKey): string | undefined {
  switch (key) {
    case "hero": return site.hero.poster;
    case "bio": return thumbUrl(site.bio.portrait);
    case "release": return thumbUrl(site.release.cover);
    case "events": return thumbUrl(site.events.posters.find((p) => p.image)?.image);
    case "gallery": return thumbUrl(site.gallery[0]?.image);
    default: return undefined;
  }
}

export function AdminApp() {
  const [signedIn, setSignedIn] = useState<boolean | null>(hasToken() ? null : false);

  useEffect(() => {
    if (signedIn === null) verify().then(() => setSignedIn(true)).catch(() => setSignedIn(false));
    const out = () => setSignedIn(false);
    window.addEventListener("admin:signed-out", out);
    return () => window.removeEventListener("admin:signed-out", out);
  }, [signedIn]);

  if (signedIn === null) return <div className="center muted">Loading…</div>;
  if (!signedIn) return <SignIn onDone={() => setSignedIn(true)} />;
  return <Editor />;
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(password);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "That password isn't right." : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center">
      <form className="signin" onSubmit={submit}>
        <div className="brand">AYOPAPO</div>
        <h1>Site editor</h1>
        <label className="field">
          <span className="field-label">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password" />
        </label>
        {error && <p className="field-hint is-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy || !password}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="hint">You'll stay signed in on this device for 30 days.</p>
      </form>
    </div>
  );
}

function Editor() {
  const [site, setSite] = useState<SiteContent | null>(null);
  const [original, setOriginal] = useState("");
  const [screen, setScreen] = useState<Screen>("home");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [loadError, setLoadError] = useState("");
  const iframe = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    getSite()
      .then((s) => {
        setSite(s);
        setOriginal(JSON.stringify(s));
      })
      .catch((err) => setLoadError((err as Error).message));
  }, []);

  // Live preview: push the draft into the iframe (debounced) on every change.
  const post = (msg: unknown) => iframe.current?.contentWindow?.postMessage(msg, location.origin);
  useEffect(() => {
    if (!site) return;
    const t = setTimeout(() => post({ type: "content", content: site }), 150);
    return () => clearTimeout(t);
  }, [site]);
  useEffect(() => {
    const s = SCREENS.find((x) => x.key === screen);
    if (s) scrollPreview(s.anchor);
  }, [screen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Warn before closing the tab with unsaved changes.
  const dirty = site !== null && JSON.stringify(site) !== original;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (loadError) return <div className="center muted">Couldn't load the site content: {loadError}</div>;
  if (!site) return <div className="center muted">Loading…</div>;

  const publish = async () => {
    setPublishing(true);
    try {
      await putSite(site);
      setOriginal(JSON.stringify(site));
      setToast({ text: "Published — it's live on the site ✓" });
    } catch (err) {
      setToast({ text: (err as Error).message, error: true });
    } finally {
      setPublishing(false);
    }
  };
  const discard = () => {
    setSite(JSON.parse(original));
    setToast({ text: "Changes undone" });
  };

  const patch = <K extends keyof SiteContent>(k: K) => (v: SiteContent[K]) => setSite({ ...site, [k]: v });
  const current = SCREENS.find((s) => s.key === screen);

  return (
    <div className={`admin admin--${mobileView}`}>
      <div className="editor">
        <header className="topbar">
          {screen === "home" ? (
            <span className="brand">AYOPAPO</span>
          ) : (
            <button type="button" className="btn btn-quiet" onClick={() => setScreen("home")}>
              ‹ All sections
            </button>
          )}
          <button type="button" className="btn btn-quiet only-mobile" onClick={() => setMobileView("preview")}>
            Preview
          </button>
        </header>

        <main className="screen">
          {screen === "home" ? (
            <>
              <h1>What do you want to change?</h1>
              <p className="hint">Pick a part of the page. Your changes show up in the preview right away and go live when you tap Publish.</p>
              <div className="cards">
                {SCREENS.map((s) => {
                  const t = thumbFor(site, s.key);
                  return (
                    <button key={s.key} type="button" className="card" onClick={() => setScreen(s.key)}>
                      {t ? <img className="card-thumb" src={t} alt="" /> : <span className="card-thumb card-thumb--empty">{s.key === "sets" ? "▶" : "@"}</span>}
                      <span className="card-text">
                        <strong>{s.title}</strong>
                        <small>{s.blurb}</small>
                      </span>
                      <span className="row-chevron" aria-hidden="true">›</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h1>{current!.title}</h1>
              {screen === "hero" && <HeroEditor value={site.hero} onChange={patch("hero")} />}
              {screen === "socials" && <SocialsEditor value={site.socials} onChange={patch("socials")} />}
              {screen === "bio" && <BioEditor value={site.bio} onChange={patch("bio")} />}
              {screen === "release" && <ReleaseEditor value={site.release} onChange={patch("release")} />}
              {screen === "events" && <EventsEditor value={site.events} onChange={patch("events")} />}
              {screen === "sets" && <SetsEditor value={site.sets} onChange={patch("sets")} />}
              {screen === "gallery" && <GalleryEditor value={site.gallery} onChange={patch("gallery")} />}
              {screen === "booking" && <BookingEditor value={site.booking} onChange={patch("booking")} />}
            </>
          )}
        </main>

        {dirty && (
          <footer className="publish-bar">
            <span>You have unsaved changes</span>
            <div className="publish-actions">
              <button type="button" className="btn btn-quiet" onClick={discard} disabled={publishing}>
                Undo all
              </button>
              <button type="button" className="btn btn-primary" onClick={publish} disabled={publishing}>
                {publishing ? "Publishing…" : "Publish to site"}
              </button>
            </div>
          </footer>
        )}
      </div>

      <div className="preview">
        <div className="preview-bar only-mobile">
          <span className="muted">Preview{dirty ? " — unpublished changes" : ""}</span>
          <button type="button" className="btn btn-primary" onClick={() => setMobileView("edit")}>
            ‹ Back to editing
          </button>
        </div>
        <iframe ref={iframe} className="preview-frame" title="Live preview of the site" src="/?preview=1" onLoad={() => post({ type: "content", content: site })} />
      </div>

      {toast && <div className={`toast${toast.error ? " is-error" : ""}`}>{toast.text}</div>}
    </div>
  );
}
