import type { GalleryPhoto, PosterCard, SiteContent, Social, Track } from "./types";
import { FileField, ImageField, ListEditor, StringList, TextInput, rowScroller, thumbUrl } from "bzs-edit/admin";

type Editor<K extends keyof SiteContent> = { value: SiteContent[K]; onChange: (next: SiteContent[K]) => void };

export function HeroEditor({ value, onChange }: Editor<"hero">) {
  const set = <K extends keyof typeof value>(k: K) => (v: (typeof value)[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <FileField
        label="Background video"
        hint="MP4, ideally under 15 MB. It plays muted on a loop behind the name."
        value={value.video}
        accept="video/mp4"
        kind="video"
        buttonLabel="Replace video"
        onChange={set("video")}
      />
      <FileField
        label="Video poster"
        hint="A still shown while the video loads. JPG or PNG."
        value={value.poster}
        accept="image/jpeg,image/png"
        kind="image"
        buttonLabel="Replace poster"
        onChange={set("poster")}
      />
      <TextInput label="Name" value={value.name} onChange={set("name")} max={20} />
      <TextInput label="Tagline" value={value.subtitle} onChange={set("subtitle")} max={60} placeholder="Rapper, DJ & Producer" />
      <TextInput label="Location line" value={value.location} onChange={set("location")} max={60} placeholder="Based in Gainesville, FL" />
    </>
  );
}

export function SocialsEditor({ value, onChange }: { value: Social[]; onChange: (v: Social[]) => void }) {
  return (
    <>
      <p className="hint">These show under the name at the top and again above the footer.</p>
      <ListEditor
        items={value}
        onChange={onChange}
        title={(s) => s.label || s.href}
        render={(s, update) => (
          <>
            <TextInput label="Name" value={s.label} onChange={(v) => update({ ...s, label: v })} max={30} placeholder="Instagram" />
            <TextInput label="Link" value={s.href} onChange={(v) => update({ ...s, href: v })} max={300} placeholder="https://…" />
          </>
        )}
        create={() => ({ label: "", href: "https://" })}
        addLabel="Add a link"
        noun="link"
        onOpen={rowScroller(".hero-links a")}
      />
    </>
  );
}

export function BioEditor({ value, onChange }: Editor<"bio">) {
  const set = <K extends keyof typeof value>(k: K) => (v: (typeof value)[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <ImageField label="Portrait" value={value.portrait} onChange={set("portrait")} />
      <TextInput label="Caption — name" value={value.captionName} onChange={set("captionName")} max={40} />
      <TextInput label="Caption — place" value={value.captionPlace} onChange={set("captionPlace")} max={40} />
      <TextInput label="Heading" value={value.heading} onChange={set("heading")} max={40} />
      <h2 className="sub">Bio</h2>
      <p className="hint">One paragraph per row. Wrap words in **double stars** for bold, _underscores_ for italics.</p>
      <StringList items={value.paragraphs} onChange={set("paragraphs")} label="Paragraph" addLabel="Add a paragraph" noun="paragraph" multiline max={800} onOpen={rowScroller(".bio-text p")} />
    </>
  );
}

export function ReleaseEditor({ value, onChange }: Editor<"release">) {
  const set = <K extends keyof typeof value>(k: K) => (v: (typeof value)[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <ImageField label="Cover art" value={value.cover} onChange={set("cover")} />
      <TextInput label="Title" value={value.title} onChange={set("title")} max={60} />
      <TextInput label="Description" value={value.blurb} onChange={set("blurb")} multiline max={400} />
      <TextInput label="Small print under the tracks" value={value.indicia} onChange={set("indicia")} max={80} placeholder="▶ Tap a track to play · full project 2026" />
      <h2 className="sub">Tags</h2>
      <p className="hint">Short labels under the cover — year, label, number of tracks.</p>
      <StringList items={value.tags} onChange={set("tags")} label="Tag" addLabel="Add a tag" noun="tag" max={20} onOpen={rowScroller(".release-tags span")} />
      <h2 className="sub">Tracks</h2>
      <p className="hint">In the order they play. Numbers are automatic.</p>
      <ListEditor<Track>
        items={value.tracks}
        onChange={set("tracks")}
        title={(t, i) => `${String(i + 1).padStart(2, "0")}  ${t.title}${t.feat ? ` ${t.feat}` : ""}`}
        badge={(t) => t.badge || undefined}
        render={(t, update) => (
          <>
            <TextInput label="Title" value={t.title} onChange={(v) => update({ ...t, title: v })} max={60} />
            <TextInput label="Featuring" value={t.feat} onChange={(v) => update({ ...t, feat: v })} max={60} placeholder="ft. Localhotboy" hint="Leave empty if it's just you." />
            <label className="field">
              <span className="field-label">Type</span>
              <select value={t.badge} onChange={(e) => update({ ...t, badge: e.target.value })}>
                <option value="">Song</option>
                <option value="Interlude">Interlude</option>
              </select>
            </label>
            <FileField
              label="Audio"
              hint="M4A or MP3, ready to stream (no WAVs)."
              value={t.audio}
              accept="audio/mp4,audio/x-m4a,audio/mpeg,.m4a,.mp3"
              kind="audio"
              buttonLabel={t.audio ? "Replace audio" : "Add audio"}
              onChange={(v) => update({ ...t, audio: v })}
            />
          </>
        )}
        create={() => ({ title: "", feat: "", badge: "", audio: "" })}
        addLabel="Add a track"
        noun="track"
        onOpen={rowScroller(".track-list .track-item")}
      />
    </>
  );
}

export function EventsEditor({ value, onChange }: Editor<"events">) {
  return (
    <>
      <TextInput label="Heading" value={value.heading} onChange={(v) => onChange({ ...value, heading: v })} max={40} />
      <h2 className="sub">Posters</h2>
      <p className="hint">Each card is a poster image or a short muted video clip.</p>
      <ListEditor<PosterCard>
        items={value.posters}
        onChange={(posters) => onChange({ ...value, posters })}
        title={(p, i) => p.caption || `Poster ${i + 1}`}
        thumb={(p) => thumbUrl(p.image)}
        badge={(p) => (p.video ? "Video" : undefined)}
        render={(p, update) => (
          <>
            <ImageField label="Poster image" value={p.image} onChange={(image) => update({ ...p, image })} />
            <FileField
              label="…or a video clip"
              hint="A short MP4 that loops silently. A caption shows over it."
              value={p.video}
              accept="video/mp4"
              kind="video"
              buttonLabel={p.video ? "Replace video" : "Add video"}
              onChange={(video) => update({ ...p, video })}
              onRemove={() => update({ image: p.image, caption: p.caption })}
            />
            <TextInput label="Caption" value={p.caption} onChange={(v) => update({ ...p, caption: v })} max={40} placeholder="Arcade Bar · May 23" hint="Only shown on video cards." />
          </>
        )}
        create={() => ({ caption: "" })}
        addLabel="Add a poster"
        noun="poster"
        onOpen={rowScroller(".poster-strip .poster-card")}
      />
    </>
  );
}

export function SetsEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <>
      <p className="hint">Paste the YouTube link of each set (from the share button). They autoplay muted under the poster wall.</p>
      <StringList items={value} onChange={onChange} label="YouTube link" addLabel="Add a set" noun="set" max={200} onOpen={rowScroller("#sets .set-embed")} />
    </>
  );
}

export function GalleryEditor({ value, onChange }: { value: GalleryPhoto[]; onChange: (v: GalleryPhoto[]) => void }) {
  return (
    <ListEditor<GalleryPhoto>
      items={value}
      onChange={onChange}
      title={(g, i) => g.alt || `Photo ${i + 1}`}
      thumb={(g) => thumbUrl(g.image)}
      render={(g, update) => (
        <>
          <ImageField label="Photo" value={g.image} onChange={(image) => update({ ...g, image })} />
          <TextInput label="Short description" value={g.alt} onChange={(v) => update({ ...g, alt: v })} max={60} hint="For screen readers and if the photo can't load." />
        </>
      )}
      create={() => ({ alt: "" })}
      addLabel="Add a photo"
      noun="photo"
      onOpen={rowScroller(".gallery-masonry img")}
    />
  );
}

export function BookingEditor({ value, onChange }: Editor<"booking">) {
  const set = <K extends keyof typeof value>(k: K) => (v: (typeof value)[K]) => onChange({ ...value, [k]: v });
  return (
    <>
      <TextInput label="Small label" value={value.eyebrow} onChange={set("eyebrow")} max={30} />
      <TextInput label="Heading" value={value.heading} onChange={set("heading")} max={40} />
      <TextInput label="Line under the heading" value={value.sub} onChange={set("sub")} multiline max={200} />
      <TextInput label="Email" value={value.email} onChange={set("email")} max={100} hint="Every card below opens an email to this address." />
      <h2 className="sub">Cards</h2>
      <StringList items={value.labels} onChange={set("labels")} label="Card label" addLabel="Add a card" noun="card" max={30} onOpen={rowScroller(".booking-cards a")} />
    </>
  );
}
