export const CLIENT_ID = "2aa184d4fa11439eaad5294d88f2ed15";
export const REDIRECT_URI = "http://127.0.0.1:5173";
export const SCOPES = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-modify",
    "user-library-read"
].join(" ");

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