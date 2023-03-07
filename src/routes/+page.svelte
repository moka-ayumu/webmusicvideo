<script lang="ts">
	import '../app.scss';
	import 'normalize.css/normalize.css';
	import * as ChatJSON from '$lib/chat.json';
	import Youtube from '$lib/components/Youtube.svelte';
	import { tick } from 'svelte';
	import { createDiffer } from '$lib/util';
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	let lastChatIndex = -1;
	const nowChatIndex = createDiffer();
	const typePos = createDiffer();
	const { timelines } = ChatJSON;

	let wordsPerChat: string[][] = [];
	let layoutPerChat: number[][] = [];
	let AnonymousMTypePTag: HTMLParagraphElement;
	let callerTypePTag: HTMLParagraphElement;
	let chatsDiv: HTMLDivElement;
	let chatLoss: { content: string; loss: number }[] = [];
	$: nowChat = timelines[$nowChatIndex];

	timelines.forEach((timeline) => {
		const layout = generateRandomNumbers(
			timeline.content.length,
			Math.max(timeline.content.length / 3, 2)
		);
		layoutPerChat.push(layout);

		let sum = 0;
		let words: string[] = [];
		layout.forEach((i) => {
			words.push(timeline.content.slice(sum, sum + i));
			sum += i;
		});
		wordsPerChat.push(words);
	});

	async function onTimeChange(e: CustomEvent<number>) {
		const time = e.detail;
		let changed = false;

		lastChatIndex = timelines.findIndex((timeline) => timeline.time + timeline.duration > time) - 1;
		if (timelines.length > lastChatIndex + 1) {
			const nextChat = timelines[lastChatIndex + 1];
			if (nextChat.time <= time && nextChat.time + nextChat.duration > time) {
				changed = nowChatIndex.set(lastChatIndex + 1);
				if (changed) {
					if (AnonymousMTypePTag) AnonymousMTypePTag.textContent = '';
				}
			} else if ($nowChatIndex !== -1) {
				nowChatIndex.reset();
				typePos.reset();
				chatLoss = [];
			}
		} else {
			nowChatIndex.reset();
			typePos.reset();
			chatLoss = [];
		}

		// Text Animation
		await tick();
		if ($nowChatIndex !== -1) {
			if (nowChat.type === 'response') {
				const timePerSegmentation = nowChat.duration / layoutPerChat[$nowChatIndex].length;
				const nowPos = Math.floor((time - nowChat.time) / timePerSegmentation);
				if (typePos.set(nowPos) || changed) {
					const span = document.createElement('span');
					span.textContent = wordsPerChat[$nowChatIndex][nowPos];
					if (AnonymousMTypePTag) AnonymousMTypePTag.appendChild(span);
					const highRandomPercentage = randomInt(40, 60);
					const randomPercentage = [
						...generateRandomNumbers(100 - highRandomPercentage, 5).sort((a, b) => a - b),
						highRandomPercentage
					];
					chatLoss = randomPercentage.map((random, i) => ({
						content:
							i === randomPercentage.length - 1
								? wordsPerChat[$nowChatIndex][nowPos]
								: wordsPerChat[randomInt(0, wordsPerChat.length - 1)][0],
						loss: random
					}));
				}
			} else {
				const timePerChar = nowChat.duration / nowChat.content.length;
				const nowPos = Math.floor((time - nowChat.time) / timePerChar);
				if (typePos.set(nowPos)) {
					if (callerTypePTag) callerTypePTag.textContent = nowChat.content.slice(0, nowPos);
				}
			}
		} else {
			if (AnonymousMTypePTag) AnonymousMTypePTag.textContent = '';
			if (callerTypePTag) callerTypePTag.textContent = '';
			chatLoss = [];
		}
		chatsDiv.scroll(0, chatsDiv.scrollTop + chatsDiv.scrollHeight);
	}

	function generateRandomNumbers(n: number, count: number) {
		// ! not generated as much as count variable;
		const avg = Math.round(n / count);
		let sum = 0;
		const result: number[] = [];
		while (sum < n) {
			const random = Math.floor(Math.random() * (avg + 2) + 2);
			result.push(random);
			sum += random;
		}
		result[result.length - 1] -= sum - n;
		return result;
	}

	function randomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min) + min);
	}
</script>

<div class="container">
	<div class="video">
		<Youtube id="yiqEEL7ac6M" on:timechange={onTimeChange} />
	</div>
	<div class="chats" bind:this={chatsDiv}>
		<div class="flex-1" />
		{#each Array(lastChatIndex + 1) as _, i}
			<div
				class="chat"
				data-type={timelines[i].type}
				data-continue={i > 0 && timelines[i].type === timelines[i - 1].type}
			>
				<div>
					{#if i <= 0 || timelines[i].type !== timelines[i - 1].type}
						<p>{timelines[i].type === 'call' ? 'ARuFa' : 'Anonymous M'}</p>
					{/if}
					<p>{timelines[i].content}</p>
				</div>
			</div>
		{/each}
		{#if $nowChatIndex !== -1 && nowChat.type === 'response'}
			<div
				class="chat"
				data-type={nowChat.type}
				data-continue={$nowChatIndex > 0 && nowChat.type === timelines[$nowChatIndex - 1].type}
			>
				<div>
					{#if $nowChatIndex <= 0 || nowChat.type !== timelines[$nowChatIndex - 1].type}
						<p>Anonymous M</p>
					{/if}
					<div class="AnonymousMType">
						<p bind:this={AnonymousMTypePTag} />
						<div class="losses" transition:fade={{ duration: 100 }}>
							{#each chatLoss as loss}
								<div transition:fade={{ duration: 100 }}>
									<p>{loss.content}</p>
									<p>0.{loss.loss.toString().padStart(2, '0')}</p>
									<div style={`width: ${loss.loss}%;`} />
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<div class="type">
		{#if $nowChatIndex !== -1 && nowChat.type === 'call'}
			<p bind:this={callerTypePTag} />
		{/if}
	</div>
</div>
<a href={`${base}/license`} class="license"> License </a>

<style lang="scss">
	:global(.AnonymousMType) {
		position: relative;
		margin-right: auto;
		& > :global(p) > :global(span) {
			position: relative;
			&::after {
				content: '';
				position: absolute;
				left: 0;
				top: 0;
				width: 100%;
				height: 100%;
				background-color: black;
				z-index: 10;
				animation-name: fadeOut;
				animation-duration: 0.2s;
				animation-fill-mode: forwards;
			}
		}
	}

	@keyframes fadeOut {
		30% {
			opacity: 100%;
		}

		100% {
			opacity: 0%;
		}
	}

	.flex-1 {
		flex: 1;
	}

	.container {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		height: 100vh;
		padding: 1rem;
		gap: 10px;
		align-items: center;
		background-color: #e5fdff;
	}

	.chats {
		display: flex;
		flex-direction: column;
		flex: 1;
		overflow-y: scroll;
		width: 100%;
		position: relative;
	}

	.chat {
		display: flex;
		position: relative;
		margin-top: 1rem;
		align-items: end;
		gap: 5px;
		&[data-type='call'][data-continue='false']::before {
			content: '';
			background-color: gray;
			width: 2rem;
			height: 2rem;
			border-radius: 100%;
		}
		&[data-type='response'][data-continue='false']::before {
			content: '';
			background-color: rgb(0, 203, 218);
			width: 2rem;
			height: 2rem;
			border-radius: 100%;
		}
		&[data-continue='true'] {
			margin: 0;
			margin-left: calc(2rem + 5px);
		}

		& > div {
			display: flex;
			flex-direction: column;
		}
	}

	.type {
		height: 2rem;
		width: 100%;
		border-radius: 10px;
		display: flex;
		align-items: center;
		padding: 0px 13px;
		box-sizing: border-box;
		background-color: white;
		flex-shrink: 0;
		&::after {
			content: '';
			width: 1.1px;
			height: 70%;
			background-color: black;
			animation: 0.5s ease-in-out 0s infinite alternate fadeOut;
		}
	}

	.losses {
		position: absolute;
		left: 100%;
		bottom: 0;
		width: 200px;
		background-color: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(10px);
		padding: 10px;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		gap: 5px;
		& > div {
			display: flex;
			position: relative;
			align-items: end;
			border-bottom: 2px solid whitesmoke;
			& > div {
				position: absolute;
				left: 0;
				bottom: -1px;
				height: 2px;
				background-color: rgb(0, 203, 218);
				transition: width 0.3s;
			}
			& > p:first-child {
				flex: 1;
			}
			& > p:nth-child(2) {
				font-size: 0.6rem;
			}
		}
	}

	.video {
		position: absolute;
		right: 10px;
		top: 10px;
		width: 200px;
		z-index: 10;
	}

	.license {
		position: fixed;
		right: 5px;
		bottom: 5px;
	}
</style>
