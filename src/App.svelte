<script lang="ts">
	import type { Action } from 'svelte/action';
	import { slide } from 'svelte/transition';
	import { innerWidth, innerHeight } from 'svelte/reactivity/window';
	import RadioTab from './lib/RadioTab.svelte';
	import MobileControls from './lib/MobileControls.svelte';
	import Module from '../src/snes9x.js';
	import { BUTTONS } from './lib/buttons';
	let isLoading = $state(false);
	let snes9xModule: any;
	let snes9xRun: Function;
	let snes9xReportButton: Function;
	let demoFolderNames: string[] = $state([]);
	let selectedFolderName = $state('');
	let canvasContainerEl: HTMLElement;
	let navEl: HTMLElement;
	const keyboardControls = Object.freeze([
		{ key: 'w', btn: '<i class="ph ph-arrow-up"></i>' },
		{ key: 'a', btn: '<i class="ph ph-arrow-left"></i>' },
		{ key: 's', btn: '<i class="ph ph-arrow-down"></i>' },
		{ key: 'd', btn: '<i class="ph ph-arrow-right"></i>' },
		{ key: 'i', btn: 'x' },
		{ key: 'j', btn: 'y' },
		{ key: 'k', btn: 'b' },
		{ key: 'l', btn: 'a' },
		{ key: ';', btn: 'r' },
		{ key: 'm', btn: 'l' },
		{ key: 'enter', btn: 'start' },
		{ key: 'shift', btn: 'select' },
	]);
	let moduleIsLoaded = false;
	const INITIAL_DEMO_NAME = 'scrolling';

	// loading
	let loadingCanvas2dContext: CanvasRenderingContext2D;
	let loadingRequestAnimId: number;
	let spinnerAngle = 0;
	let loadingText = '';
	const updateLoadingCanvas = () => {
		loadingCanvas2dContext.clearRect(0, 0, 256, 224);
		loadingCanvas2dContext.beginPath();
		loadingCanvas2dContext.arc(32, 32, 4, spinnerAngle, spinnerAngle + Math.PI*1.5);
		loadingCanvas2dContext.stroke();
		loadingCanvas2dContext.fillText(`${loadingText}...`, 42, 32);
		spinnerAngle += 0.1;
		isLoading && (loadingRequestAnimId = requestAnimationFrame(updateLoadingCanvas));
	}
	const startLoading = (text: string) => {
		loadingText = text;
		isLoading = true;
		loadingRequestAnimId = requestAnimationFrame(updateLoadingCanvas);
	}
	const stopLoading = () => {
		isLoading = false;
		cancelAnimationFrame(loadingRequestAnimId);
	}
	const onLoadingOverlayCanvasMount: Action<HTMLCanvasElement> = (canvas: HTMLCanvasElement) => {
		const ctx = canvas.getContext('2d');
		if (ctx === null) return;
		loadingCanvas2dContext = ctx;
		loadingCanvas2dContext.lineWidth = 1;
		loadingCanvas2dContext.fillStyle = 'white';
		loadingCanvas2dContext.strokeStyle = 'white';
		loadingCanvas2dContext.textBaseline = 'middle';
	}

	const loadInitialDemo = () =>
		demoFolderNames.length
		&& demoFolderNames.includes(INITIAL_DEMO_NAME)
		&& moduleIsLoaded
		&& openAndRunSfc(INITIAL_DEMO_NAME);

	(async () => {
		type GithubRepoNode = {
			type: string,
			name: string,
		}
		startLoading('fetching demo names from GitHub');
		const ghApiRes = await fetch('https://api.github.com/repos/taylorplewe/snes-demos/contents');
		const ghApiJson = await ghApiRes.json();
		const nonSfcFolders = Object.freeze({
			'boiler': true,
			'.github': true,
		});
		demoFolderNames = ghApiJson.filter((item: GithubRepoNode) => item.type === 'dir' && !(item.name in nonSfcFolders)).map((item: GithubRepoNode) => item.name);
		demoFolderNames.push('tetris');
		stopLoading();
		loadInitialDemo();
	})();

	const print = (text: string) => console.log(text);
	const getSfcUrlFromFolderName = (folderName: string) => folderName === 'tetris'
		? 'https://raw.githubusercontent.com/taylorplewe/snes-tetris/refs/heads/master/bin/tetris.sfc'
		: `https://raw.githubusercontent.com/taylorplewe/snes-demos/main/${folderName}/bin/${folderName}.sfc`;
	const openAndRunSfc = async (folderName: string) => {
		showMobileNav = false;
		selectedFolderName = folderName;
		startLoading('fetching sfc file from GitHub');
		const res = await fetch(getSfcUrlFromFolderName(folderName));
		const blob = await res.blob();
		const reader = new FileReader();
		reader.onload = e => {
			print('file loaded');
			if (reader.result instanceof ArrayBuffer) {
				try {
					snes9xModule.FS_createDataFile('/', `${folderName}.sfc`, new Uint8Array(reader.result) , true, true);
				} catch {
					console.log(`Unable to create file "${folderName}.sfc"; file may already exist`);
				}
				stopLoading();
				snes9xRun(`${folderName}.sfc`);
			}
		};
		print('loading .sfc file...');
		reader.readAsArrayBuffer(blob);
	}
	const prepModule = async (canvas: HTMLCanvasElement) => {
		snes9xModule = await Module({ print, canvas });
		snes9xRun = snes9xModule.cwrap('run', null, ['string']);
		snes9xReportButton = snes9xModule.cwrap('S9xReportButton', null, ['number', 'boolean']);
		moduleIsLoaded = true;
		loadInitialDemo();
	}
	const isDesktopScreenMediaQueryList = window.matchMedia('(min-width: 1024px)');
	const resizeCanvas = () => {
		if (innerWidth.current === undefined || innerHeight.current === undefined) return;
		if (!isDesktopScreenMediaQueryList.matches) {
			canvasContainerEl.removeAttribute('style');
			return;
		}
		if (!navEl || !canvasContainerEl) return;
		let _innerWidth = innerWidth.current;
		_innerWidth -= navEl.clientWidth;
		const prod = Math.min(Math.floor(_innerWidth/256), Math.floor(innerHeight.current/224));
		canvasContainerEl.style.width = `${256*prod}px`;
	}
	$effect(resizeCanvas);
	const onCanvasMount: Action<HTMLCanvasElement> = (canvas: HTMLCanvasElement) => {
		prepModule(canvas);
	}

	// mobile
	const isTouchEnabled = 'ontouchstart' in document.documentElement;
	let showMobileNav = $state(false);
	const updateMobileButtonsDown = (buttonsDown: any) => {
		snes9xReportButton('w'.charCodeAt(0), buttonsDown & BUTTONS.U);
		snes9xReportButton('a'.charCodeAt(0), buttonsDown & BUTTONS.L);
		snes9xReportButton('s'.charCodeAt(0), buttonsDown & BUTTONS.D);
		snes9xReportButton('d'.charCodeAt(0), buttonsDown & BUTTONS.R);
		snes9xReportButton('i'.charCodeAt(0), buttonsDown & BUTTONS.X);
		snes9xReportButton('j'.charCodeAt(0), buttonsDown & BUTTONS.Y);
		snes9xReportButton('k'.charCodeAt(0), buttonsDown & BUTTONS.B);
		snes9xReportButton('l'.charCodeAt(0), buttonsDown & BUTTONS.A);
		snes9xReportButton('m'.charCodeAt(0), buttonsDown & BUTTONS.LB);
		snes9xReportButton(';'.charCodeAt(0), buttonsDown & BUTTONS.RB);
		snes9xReportButton(13, buttonsDown & BUTTONS.START);
		snes9xReportButton(1249, buttonsDown & BUTTONS.SELECT);
	};
</script>

<nav class="desktop" bind:this={navEl}>
	{#if demoFolderNames.length}
		<ul transition:slide={{ axis: 'x' }}>
			{#each demoFolderNames as folderName}
				<RadioTab isSelected={selectedFolderName === folderName} text={folderName} onClick={() => openAndRunSfc(folderName)}></RadioTab>
			{/each}
		</ul>
	{/if}
</nav>
<main>
	<div id="canvasContainer" bind:this={canvasContainerEl}>
		<canvas use:onCanvasMount width="256" height="224"></canvas>
		{#if !isTouchEnabled}
			<dl id="keyboardControlsList">
				{#each keyboardControls as mapping}
					<dt>{@html mapping.btn}</dt>
					<dd><kbd>{mapping.key}</kbd></dd>
				{/each}
			</dl>
		{/if}
		{#if isLoading}
			<canvas use:onLoadingOverlayCanvasMount width="256" height="224"></canvas>
		{/if}
	</div>
	<footer class="desktop">Taylor Plewe, 2025 | <a href="https://github.com/taylorplewe/snes-demos" target="_blank">source code</a></footer>
</main>
{#if !showMobileNav}
	<button id="mobileNavHandle" onclick={() => showMobileNav = true}>
		DEMOS
		<svg width="10" height="5" viewBox="0 0 2 1">
			<polygon points="0,0 2,0 1,1" fill="white" />
		</svg>
	</button>
{:else}
	<nav class="mobile" transition:slide={{ axis: 'y' }}>
		<button aria-label="Close demo list" id="mobileNavClose" onclick={() => showMobileNav = false}>
			<svg width="16" height="16" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><line x1="200" y1="56" x2="56" y2="200" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><line x1="200" y1="200" x2="56" y2="56" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>
		</button>
		{#if demoFolderNames.length}
			<ul>
				{#each demoFolderNames as folderName}
					<RadioTab isSelected={selectedFolderName === folderName} text={folderName} onClick={() => openAndRunSfc(folderName)}></RadioTab>
				{/each}
			</ul>
		{/if}
		<footer class="mobile">Taylor Plewe, 2025 | <a href="https://github.com/taylorplewe/snes-demos" target="_blank">source code</a></footer>
	</nav>
{/if}
{#if isTouchEnabled}
	<MobileControls updateMobileButtonsDown={updateMobileButtonsDown} />
{/if}

<style>
	nav {
		z-index: var(--z-nav);
		overflow: auto;
		background-color: var(--col-button);
		&.desktop {
			display: none;
			flex-shrink: 0;
			height: 100vh;
		}
		&.mobile {
			position: relative;
			display: unset;
			outline: 1px solid var(--col-hilite);
		}
	}
	footer {
		font-style: italic;
		&.desktop {
			display: none;
		}
		&.mobile {
			padding: 18px;
		}
	}
	main {
		position: relative;
		z-index: var(--z-main);
		flex-grow: 0;
		display: flex;
		gap: 8px;
		flex-direction: column;
		place-items: center;
		justify-content: center;
	}
	canvas {
		position: absolute;
		width: 100%;
		height: 100%;
		background-color: black;
		border-radius: 0;
		image-rendering: pixelated;
	}
	#canvasContainer {
		position: relative;
		width: 100%;
		max-width: calc(100dvh * (256/224));
		aspect-ratio: 256/224;
		box-shadow: 0px 20px 60px rgba(0, 0, 0, .6);
	}
	#keyboardControlsList {
		opacity: 0.3;
		margin: 0;
		position: absolute;
		left: 0;
		bottom: 0;
		transform: translate(calc(-100% - 16px));
		display: grid;
		grid-template-columns: auto auto;
		column-gap: 16px;
		text-transform: capitalize;
		font-size: 18pt;
		dt {
			text-align: right;
			font-weight: 100;
		}
		dd {
			margin: 0;
			font-weight: bold;
		}
	}
	#mobileNavHandle {
		align-self: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 12px 12px 8px 12px;
		background-color: var(--col-button);
		font-size: 9pt;
		width: max-content;
		&:hover {
			background-color: var(--col-button-hover);
		}
	}
	#mobileNavClose {
		line-height: 0;
		position: sticky;
		top: 0;
		left: 100%;
		padding: 18px;
		background-color: transparent;
		&:active {
			background-color: var(--col-button-hover);
		}
	}

	@media only screen and (min-width: 1024px) {
		nav {
			&.desktop {
				display: unset;
			}
			&.mobile {
				display: none;
			}
		}
		main {
			flex-grow: 1;
		}
		footer.desktop {
			display: unset;
		}
		canvas {
			border-radius: 4px;
		}
		#canvasContainer {
			max-width: unset;
		}
		#mobileNavHandle {
			display: none;
		}
	}
</style>
