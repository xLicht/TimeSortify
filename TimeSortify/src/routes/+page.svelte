<script lang="ts">
    import {CLIENT_ID, REDIRECT_URI, SCOPES, generateCodeVerifier, generateCodeChallenge} from '$lib/auth/spotify';

    async function login() {
        // Spotify OAuth redirect

        const verifier = await generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);

        localStorage.setItem("verifier", verifier);

        const url = new URL("https://accounts.spotify.com/authorize");
        url.searchParams.set("client_id", CLIENT_ID);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("redirect_uri", REDIRECT_URI);
        url.searchParams.set("scope", SCOPES);
        url.searchParams.set("code_challenge_method", "S256");
        url.searchParams.set("code_challenge", challenge);

        window.location.href = url.toString();

    }
</script>

<main class="p-8 space-y-6">
	<h1 class="text-3xl font-bold">TimeSortify</h1>
	<button
		on:click={login}
		class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
	>
		Connect with Spotify</button
	>
</main>
