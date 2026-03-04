export const SITE = {
  name: "PAPO",
  tagline: "Music. Energy. Movement.",
  description: "Official EPK for Papo — DJ, producer, and live performer.",
  url: "https://papo.music",
} as const;

export const NAV_LINKS = [
  { label: "Music", href: "#music" },
  { label: "Videos", href: "#videos" },
  { label: "Gallery", href: "#gallery" },
  { label: "Bio", href: "#bio" },
  { label: "Contact", href: "#contact" },
] as const;

export const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com/papo", icon: "instagram" },
  { label: "SoundCloud", href: "https://soundcloud.com/papo", icon: "soundcloud" },
  { label: "Spotify", href: "https://open.spotify.com/artist/papo", icon: "spotify" },
  { label: "YouTube", href: "https://youtube.com/@papo", icon: "youtube" },
] as const;

export const GATE_STORAGE_KEY = "papo-gate-solved";

export const COLORS = {
  magenta: "#e91e8c",
  cyan: "#00e5ff",
  violet: "#8b5cf6",
  amber: "#f59e0b",
} as const;
