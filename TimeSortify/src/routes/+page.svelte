<script lang="ts">
    import {CLIENT_ID, REDIRECT_URI, SCOPES, generateCodeVerifier, generateCodeChallenge, getAllUserPlaylist} from '$lib/auth/spotify';
    import {onMount} from 'svelte';
    import {setAccessToken, getUserProfile, getPlaylists} from '$lib/auth/spotify';
    import PlaylistCard from '$lib/components/PlaylistCard.svelte';

    let profile: any = null;
    let userPlaylists: any[] = [];
    let selectedPlaylists = new Set<string>();
    let orderBy = 'added_desc'; 
    let duplicateStrategy: 'recent' | 'oldest' | null = null;

    function selectDuplicateStrategy(value: 'recent' | 'oldest') {
	duplicateStrategy = value; }

    function togglePlaylist(id: string) {
        if(selectedPlaylists.has(id)) {
            selectedPlaylists.delete(id);
        } else {
            selectedPlaylists.add(id);
        }
        
        selectedPlaylists = new Set(selectedPlaylists);
    }


    async function getUserPlaylists() {
        try{
            const allPlaylists = await getAllUserPlaylist();

            userPlaylists = allPlaylists.filter((
                playlist: any) => playlist.owner.id === profile.id);
            console.log("User Playlists: ", userPlaylists);
        } catch (e) {
            console.error("Error fetching user playlists", e)
        }
    }

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
        if (profile) {
            getUserPlaylists();
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

	<div class="bg-neutral-700 items-center justify-center pt-8">
		{#if profile}
			<div class="flex items-center justify-center">
				<p class="text-3xl font-[Signika] text-white font-bold">Welcome {profile.display_name} !</p>
			</div>
			<div class="ml-20 mr-20 pt-8">
				<p class="text-3xl font-[Signika] text-white font-bold">Your Playlists</p>
				<p class="text-xl font-[Signika] text-white">
					Please, select from which playlist do you want to transfer into liked songs
				</p>
			</div>
			<div class="flex flex-col lg:flex-row gap-6 ml-20 mr-20">
				<div class="w-full lg:w-2/3">
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
						{#each userPlaylists as playlist}
							<PlaylistCard
								{playlist}
								selected={selectedPlaylists.has(playlist.id)}
								on:click={() => togglePlaylist(playlist.id)}
							/>
						{/each}
					</div>
				</div>

				<div class="w-full lg:w-1/3 space-y-4 text-white font-[Signika] pt-8">
					<p class="text-3xl font-bold">Settings</p>
					<p class="text-xl font-semibold">Order By:</p>

					<select
						bind:value={orderBy}
						class="w-full bg-neutral-600 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
					>
						<option value="added_desc">Date added (newest first)</option>
						<option value="added_asc">Date added (oldest first)</option>
					</select>

					<p class="text-xl font-semibold">If there are duplicated songs:</p>

					<div class="space-y-2">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={duplicateStrategy === 'recent'}
								on:change={() => selectDuplicateStrategy('recent')}
							/>
							<span>Use most recent date</span>
						</label>

						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={duplicateStrategy === 'oldest'}
								on:change={() => selectDuplicateStrategy('oldest')}
							/>
							<span>Use oldest date</span>
						</label>
					</div>

					<button
						class="mt-4 px-4 py-2 rounded-md transition
		{duplicateStrategy ? 'bg-green-600 hover:bg-green-700' : 'bg-neutral-500 cursor-not-allowed'}"
						disabled={!duplicateStrategy}
					>
						Finish
					</button>
				</div>
			</div>
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
