export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  src: string;
  coverArt?: string;
  genre?: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  platform: "youtube" | "vimeo";
  date?: string;
  description?: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  category?: "live" | "studio" | "press" | "bts";
}

export interface SocialLink {
  label: string;
  href: string;
  icon: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
}
