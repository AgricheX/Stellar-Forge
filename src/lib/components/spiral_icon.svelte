<script lang="ts">
	type Props = { class?: string; size?: number };
	const { class: class_name = '', size = 24 }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={class_name}
>
	<path
		d="M12 12c0-1 1-1.6 1.8-1.2.9.5.9 2 .1 2.8-1.1 1.1-3 1-4-.2-1.3-1.5-1-3.9.6-5.1 2-1.5 5-1 6.4 1 1.7 2.4 1 5.8-1.4 7.4-2.9 1.9-6.9 1-8.7-1.8"
	/>
	<path d="M12 12c0 1-1 1.6-1.8 1.2" opacity="0.6" />
	<circle cx="12" cy="12" r="1" fill="currentColor" />
</svg>
