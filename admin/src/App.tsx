import { AdminShell, getContent, putContent, thumbUrl, type Screen } from "bzs-edit/admin";
import type { SiteContent } from "./types";
import { BioEditor, BookingEditor, EventsEditor, GalleryEditor, HeroEditor, ReleaseEditor, SetsEditor, SocialsEditor } from "./sections";

type Key = "hero" | "socials" | "bio" | "release" | "events" | "sets" | "gallery" | "booking";

// Page order. `anchor` is what the live preview scrolls to — the section's content, not
// the section box (those have ~200px of top padding), so the edit is in view.
const SCREENS: Screen<Key>[] = [
  { key: "hero", title: "Top of the page", blurb: "Background video, name and tagline", anchor: "" },
  { key: "socials", title: "Social links", blurb: "Instagram, Spotify… shown under the name and in the footer", anchor: ".hero-links" },
  { key: "bio", title: "Biography", blurb: "Portrait photo and bio text", anchor: "#bio .bio-grid" },
  { key: "release", title: "Release & tracks", blurb: "Cover art, blurb and the playable track list", anchor: "#releases .releases-grid" },
  { key: "events", title: "DJ Events", blurb: "The poster wall", anchor: "#archives .archives-head" },
  { key: "sets", title: "DJ sets", blurb: "YouTube videos under the posters", anchor: "#sets" },
  { key: "gallery", title: "Gallery", blurb: "The photo grid", anchor: "#gallery .section-heading" },
  { key: "booking", title: "Booking", blurb: "Email cards at the bottom", anchor: "#book .booking-heading" },
];

function thumbFor(site: SiteContent, key: Key): string | undefined {
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
  return (
    <AdminShell<SiteContent, Key>
      brand="AYOPAPO"
      screens={SCREENS}
      load={() => getContent<SiteContent>("site.json")}
      save={(site) => putContent("site.json", site).then(() => undefined)}
      thumbFor={thumbFor}
      placeholder={(key) => (key === "sets" ? "▶" : "@")}
      render={(site, key, set) => {
        const patch = <K extends keyof SiteContent>(k: K) => (v: SiteContent[K]) => set({ ...site, [k]: v });
        switch (key) {
          case "hero": return <HeroEditor value={site.hero} onChange={patch("hero")} />;
          case "socials": return <SocialsEditor value={site.socials} onChange={patch("socials")} />;
          case "bio": return <BioEditor value={site.bio} onChange={patch("bio")} />;
          case "release": return <ReleaseEditor value={site.release} onChange={patch("release")} />;
          case "events": return <EventsEditor value={site.events} onChange={patch("events")} />;
          case "sets": return <SetsEditor value={site.sets} onChange={patch("sets")} />;
          case "gallery": return <GalleryEditor value={site.gallery} onChange={patch("gallery")} />;
          case "booking": return <BookingEditor value={site.booking} onChange={patch("booking")} />;
        }
      }}
    />
  );
}
