/** Shape of content/site.json — the single source of truth the public site renders from (src/content.js). */

/** Responsive image. `sources` are srcset strings (empty for seed images that were never uploaded). */
export type Picture = {
  sources: { avif?: string; webp?: string; jpeg?: string };
  img: { src: string; w: number; h: number };
};

export type Social = { label: string; href: string };
export type Track = { title: string; feat: string; badge: string; audio: string };
/** A poster-wall card: a poster image OR a short looping video with a caption. */
export type PosterCard = { image?: Picture; video?: string; caption: string };
export type GalleryPhoto = { image?: Picture; alt: string };

export type SiteContent = {
  hero: { name: string; subtitle: string; location: string; video: string; poster: string };
  /** Shown under the hero name and again in the footer. */
  socials: Social[];
  bio: { heading: string; portrait: Picture; captionName: string; captionPlace: string; paragraphs: string[] };
  release: { title: string; cover: Picture; tags: string[]; blurb: string; indicia: string; tracks: Track[] };
  events: { heading: string; posters: PosterCard[] };
  /** YouTube links, one per embed. */
  sets: string[];
  gallery: GalleryPhoto[];
  booking: { eyebrow: string; heading: string; sub: string; email: string; labels: string[] };
};
