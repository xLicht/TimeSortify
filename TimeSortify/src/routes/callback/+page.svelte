<script lang="ts">
    import {onMount} from 'svelte';
    import { setAccessToken } from "$lib/auth/spotify";
    import {exchangeCodeForToken} from "$lib/auth/spotify";

    onMount(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const verifier = localStorage.getItem("verifier");

        if (!code || !verifier) {
            console.error("Missing code or verifier");
            return;
        }

        const token = await exchangeCodeForToken(code, verifier);

        setAccessToken(token.access_token);

        localStorage.setItem("spotify_token", token.access_token);

        window.location.replace("/");
    });
</script>

<p class="text-center mt-10 text-lg">Connecting with Spotify...</p>
