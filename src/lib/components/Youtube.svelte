<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import YoutubePlayer from 'youtube-player';
	import type { YouTubePlayer } from 'youtube-player/dist/types';

	export let id: string;
	let playerDiv: HTMLDivElement;
	let player: YouTubePlayer;
	let time = 0;

	const dispatch = createEventDispatcher();

	onMount(() => {
		player = YoutubePlayer(playerDiv, {
			videoId: id
		});

		setInterval(() => {
			player.getCurrentTime().then((v) => {
				v = Math.round(v * 1000);
				if (time !== v) {
					time = v;
					dispatch('timechange', time);
				}
			});
		}, 100);

		return player.destroy;
	});
</script>

<div bind:this={playerDiv} style="width: 100%; height:100%;" />
