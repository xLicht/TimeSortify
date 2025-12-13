<script lang="ts">
    import {CLIENT_ID, REDIRECT_URI, SCOPES, generateCodeVerifier, generateCodeChallenge, getAllUserPlaylist, getAllPlaylistTracks, addTracksToLiked} from '$lib/auth/spotify';
    import {onMount} from 'svelte';
    import {setAccessToken, getUserProfile} from '$lib/auth/spotify';
    import PlaylistCard from '$lib/components/PlaylistCard.svelte';

    let isProcessing = false;
    let progress = 0;
    let progressText = '';
    let forceStrictOrder = false;
    let skippedLocalTracks: {
        name: string;
        artist: string;
    }[] = [];



    let profile: any = null;
    let userPlaylists: any[] = [];
    let selectedPlaylists = new Set<string>();
    let orderBy: 'asc' | 'desc' = 'asc';
    let duplicateStrategy: 'recent' | 'oldest' = 'recent';

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

    async function fetchSelectedPlaylistsTracks() {
        const playlistsIds = Array.from(selectedPlaylists);

        const allTracksPerPlaylist = [];

        for (const id of playlistsIds) {
            const tracks = await getAllPlaylistTracks(id);

            allTracksPerPlaylist.push({playlistId: id, tracks});
        }
        return allTracksPerPlaylist;
    }


    function falltenTracks(playlistData: any[]) {
	return playlistData.flatMap(p =>
		p.tracks.flatMap((item: any) => {
			const track = item.track;

			if (!track || track.is_local || !track.id) {
				if (track) {
					skippedLocalTracks.push({
						name: track.name,
						artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown'
					});
				}
				return [];
			}

			return [{
				trackId: track.id,
				addedAt: item.added_at,
				track
			}];
		})
	);
}


    function sortTracksByDate(tracks: any[], order: 'asc' | 'desc') {
        return [...tracks].sort((a, b) => {
            const dateA = new Date(a.addedAt).getTime();
            const dateB = new Date(b.addedAt).getTime();

            return order === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }

    function deduplicateTracks(
        tracks: any[],
        strategy: 'keep-first' | 'keep-last'
    ) {
        const map = new Map<string, any>();

        for (const item of tracks) {
            const id = item.trackId;

            if (!map.has(id)) {
                map.set(id, item);
            } else if (strategy === 'keep-last') {
                map.set(id, item);
            }
        }

        return Array.from(map.values());
    }

    function chunkArray<T>(array: T[], size: number): T[][] {
        const chunks = [];
        for (let i = 0; i<array.length; i += size) {
            chunks.push(array.slice(i, i+size));
        }
        return chunks;
    }

    function sleep(ms: number) {
	    return new Promise(resolve => setTimeout(resolve, ms));
    }

    

    async function addTracksStrictly(trackIds: string[]) {
	for (let i = 0; i < trackIds.length; i++) {
            try {
                await addTracksToLiked([trackIds[i]]);
            } catch (e) {
                console.warn(`Skipped track ${trackIds[i]}`, e);
                continue;
            }

            progress = Math.round(((i + 1) / trackIds.length) * 100);
            progressText = `Adding track ${i + 1} of ${trackIds.length}`;
            await sleep(500);
        }
    }


    async function addTracksFast(trackIds: string[]) {
	const batches = chunkArray(trackIds, 50);

	for (let i = 0; i < batches.length; i++) {
		await addTracksToLiked(batches[i]);

		progress = Math.round(((i + 1) / batches.length) * 100);
		await sleep(300);
	}
}


    async function onFinish() {
        try {
            isProcessing = true;
            progress = 0;
            progressText = 'Fetching Tracks...';
            skippedLocalTracks = [];


            const playlistData = await fetchSelectedPlaylistsTracks();
            const allTracks = falltenTracks(playlistData);
            const orderedTracks = sortTracksByDate(allTracks, orderBy);
            const dedupedTracks = deduplicateTracks(orderedTracks, duplicateStrategy === 'recent' ? 'keep-last' : 'keep-first');
            console.log(dedupedTracks)
            const trackIds = dedupedTracks.map(t => t.trackId);

            progressText = forceStrictOrder
                ? 'Adding songs strictly (this may take a while)...'
                : 'Adding songs to Liked Songs...';

            if (forceStrictOrder) {
                await addTracksStrictly(trackIds);
            } else {
                await addTracksFast(trackIds);
            }




            console.log("Tracks added to Liked Songs:", trackIds.length);
            progressText = 'Tracks added successfully';
        } catch (error) {
            console.error("Error finishing process", error);
		    progressText = 'Something went wrong ❌';
        } finally {
            isProcessing = false;
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

					<select bind:value={orderBy} class="bg-neutral-600 text-white p-2 rounded-md w-full">
						<option value="asc">Date added (oldest first)</option>
						<option value="desc">Date added (newest first)</option>
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
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={forceStrictOrder} />
						<span>Force strict order (slower)</span>
					</label>
					<p class="text-2xs text-neutral-400">
						Spotify does not guarantee the order in which tracks are added when multiple requests
						are processed. This mode adds songs sequentially to better preserve the original order,
						but minor swaps between adjacent tracks may still occur.
					</p>

					<button
						on:click={onFinish}
						disabled={isProcessing || selectedPlaylists.size === 0}
						class="mt-4 px-4 py-2 rounded-md transition
	{isProcessing || selectedPlaylists.size === 0
							? 'bg-neutral-500 cursor-not-allowed'
							: 'bg-green-600 hover:bg-green-700'}"
					>
						{isProcessing ? 'Processing...' : 'Finish'}
					</button>

					{#if isProcessing}
						<div class="mt-4 space-y-2">
							<p class="text-sm text-neutral-300">{progressText}</p>

							<div class="w-full bg-neutral-600 rounded-full h-3 overflow-hidden">
								<div
									class="bg-green-500 h-full transition-all duration-300"
									style="width: {progress}%"
								></div>
							</div>

							<p class="text-sm text-neutral-400 text-right">{progress}%</p>
						</div>
					{/if}

					{#if skippedLocalTracks.length > 0}
						<div class="mt-4 p-3 bg-yellow-900/40 rounded-md">
							<p class="text-sm font-semibold text-yellow-300">
								⚠ Skipped local files ({skippedLocalTracks.length})
							</p>

							<ul class="mt-2 max-h-40 overflow-y-auto text-xs text-yellow-200 space-y-1">
								{#each skippedLocalTracks as track}
									<li>
										<strong>{track.name}</strong>
										<span class="opacity-70"> — {track.artist}</span>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
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
