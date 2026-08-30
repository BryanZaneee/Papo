import type { Picture, SiteContent } from "./types";

const TOKEN_KEY = "admin_token";
let token: string | null = localStorage.getItem(TOKEN_KEY);

export function hasToken() {
  return token !== null;
}

function signOut() {
  token = null;
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("admin:signed-out"));
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");

  const res = await fetch(`/api${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login") signOut();
    throw new ApiError(data.error ?? `Something went wrong (${res.status})`, res.status);
  }
  return data as T;
}

export async function login(password: string) {
  const { token: t } = await apiFetch<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  token = t;
  localStorage.setItem(TOKEN_KEY, t);
}

export const verify = () => apiFetch<{ valid: boolean }>("/auth/verify");
export const getSite = () => apiFetch<SiteContent>("/content/site.json");
export const putSite = (site: SiteContent) =>
  apiFetch<{ success: true }>("/content/site.json", { method: "PUT", body: JSON.stringify(site) });

function form(file: File, kind: "image" | "file") {
  const fd = new FormData();
  fd.append("kind", kind);
  fd.append("file", file);
  return fd;
}

/** Photos → responsive Picture (AVIF/WebP/JPEG srcsets). */
export const uploadImage = (file: File) =>
  apiFetch<{ picture: Picture }>("/upload", { method: "POST", body: form(file, "image") }).then((r) => r.picture);

/** The hero MP4 and its poster, poster-wall clips, track audio → plain URL. */
export const uploadFile = (file: File) =>
  apiFetch<{ url: string }>("/upload", { method: "POST", body: form(file, "file") }).then((r) => r.url);
