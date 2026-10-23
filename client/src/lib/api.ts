const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

// Shared promise: if two parts of the app ask for a refresh at the same moment,
// only one request is sent. This matters because each refresh token works once.
export function refreshSession(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(API_URL + "/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          accessToken = null;
          return null;
        }
        const data = await res.json();
        accessToken = data.accessToken as string;
        return accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(path: string, options: Omit<RequestInit, "headers"> = {}) {
  function send() {
    return fetch(API_URL + path, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      },
    });
  }

  let res = await send();

  // Access token expired: get a new one once and retry the request
  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    const newToken = await refreshSession();
    if (newToken) {
      res = await send();
    }
  }

  return res;
}