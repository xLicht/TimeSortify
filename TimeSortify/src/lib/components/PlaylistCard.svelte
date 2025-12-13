<script lang="ts">
    export let playlist: any;
    export let selected = false;
</script>

<button
	on:click
	class="rounded-lg p-4 text-left transition {selected
		? 'bg-green-600 ring-4 ring-green-400'
		: 'bg-neutral-700 hover:bg-neutral-600'}"
>
	<img
		src={playlist.images?.[0]?.url}
		alt={playlist.name}
		class="w-full aspect-square rounded-md mb-3"
	/>

	<h3 class="text-white font-[Signika] font-semibold truncate">{playlist.name}</h3>

	<p class="text-sm text-neutral-300">{playlist.tracks.total} songs</p>
</button>
