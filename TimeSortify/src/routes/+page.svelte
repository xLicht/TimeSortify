<script lang="ts">
    import {CLIENT_ID, REDIRECT_URI, SCOPES, generateCodeVerifier, generateCodeChallenge} from '$lib/auth/spotify';
    import {onMount} from 'svelte';
    import {setAccessToken, getUserProfile} from '$lib/auth/spotify';

    let profile: any = null;

    onMount(async () => {
        const savedToken = localStorage.getItem("spotify_token");

        if (savedToken) {
            setAccessToken(savedToken);

            try {
                profile = await getUserProfile();
                console.log(profile);
            } catch (e) {
                console.error("Invalid or Expired Token", e);
                localStorage.removeItem("spotify_token");
            }
        }
    });

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

<main class="pt-8 space-y-6 bg-neutral-800">
	<div class="flex items-center justify-center bg-neutral-800">
		<h1 class="text-4xl font-bold text-white font-[Signika]">TimeSortify</h1>
	</div>

	<div class="bg-neutral-700 flex items-center justify-center pt-8">
		{#if profile}
			<p class="text-2xl font-[Signika] text-white">Welcome {profile.display_name} !</p>
		{:else}
			<button
				on:click={login}
				class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
			>
				Connect with Spotify</button
			>
		{/if}
	</div>
</main>
