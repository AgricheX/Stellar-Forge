<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};
	const { children }: Props = $props();
</script>

<div class="flex items-center gap-2 mt-3">
	<span
		class="size-1.5 rotate-45 bg-primary-500 shadow-[0_0_6px_rgba(229,50,45,0.9)]"
	></span>
	<h2 class="sf-tag text-surface-800-200! font-semibold">
		{@render children()}
	</h2>
	<hr class="grow border-t border-surface-200-800" />
</div>
