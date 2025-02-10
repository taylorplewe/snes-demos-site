<script lang="ts">
	const { isSelected, text, onClick } = $props();
</script>

<li>
	<button class={isSelected ? 'selected' : ''} onclick={onClick}>
		{text}
	</button>
</li>

<style>
button {
	background-color: transparent;
	width: 100%;
	padding: 18px;
	cursor: pointer;
	transition: background-color 0.4s ease;
	&:hover {
		background-color: transparent;
	}
	&.selected {
		background-color: var(--col-button-selected);
	}
}

@media only screen and (min-width: 1024px) {
	button {
		padding: 24px;
		&:hover {
			background-color: var(--col-button-hover);
		}
	}
}
</style>
