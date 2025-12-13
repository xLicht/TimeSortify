// Spotify config
export const CLIENT_ID = "2aa184d4fa11439eaad5294d88f2ed15";
export const REDIRECT_URI = "http://127.0.0.1:5173/callback";
export const SCOPES = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-modify",
    "user-library-read"
].join(" ");

// PKCE Helpers
export async function generateCodeVerifier(lenght = 128) {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

    for (let i = 0; i < lenght; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Token storage
let accessToken = '';

export function setAccessToken(token: string) {
    accessToken = token;
}

// Exchange code
export async function exchangeCodeForToken(code: string, verifier: string) {
    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier
    });

    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
    });

    if (!res.ok) {
        throw new Error("Failed to Exchange code for Token");
    }

    const data = await res.json();

    setAccessToken(data.access_token);

    return data;
}


// Spotify API calls
export async function getUserProfile() {
    const res = await fetch('https://api.spotify.com/v1/me', {
        headers: {Authorization: `Bearer ${accessToken}`}
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(
            data?.error?.message || "Failed to fetch user profile"
        );
    }

    return data;
}

export async function getAllUserPlaylist() {
    let playlists: any[] = [];
    let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";

    while (url) {
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data?.error?.message || "Failed to fetch playlists"
            );
        }

        playlists = playlists.concat(data.items);
        url = data.next;
    }

    return playlists;
}

// not used
export async function getPlaylists() {
    const res = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(
            data?.error?.message || "Failed to fetch user playlists"
        );
    }

    return data;
}

export async function getPlaylistTracks(id: string) {
    const res = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=1000`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await res.json();
}