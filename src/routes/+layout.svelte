<script lang="ts">
	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/toaster';
	import './layout.css';
	import { t } from '$lib/i18n/index.svelte';

	let { children } = $props();

	function on_error(event: Event) {
		const error_event = event as ErrorEvent;
		toaster.error({
			title: t('Unexpected Error'),
			description: error_event.error?.message ?? error_event.message,
		});
	}

	function on_unhandledrejection(event: PromiseRejectionEvent) {
		toaster.error({
			title: t('Unexpected Error'),
			description:
				event.reason instanceof Error ?
					event.reason.message
				:	String(event.reason),
		});
	}
</script>

<svelte:head>
	<title>Stellar Forge · {t('Stellaris galaxy maker')}</title>
</svelte:head>

<svelte:window
	onerror={on_error}
	onunhandledrejection={on_unhandledrejection}
/>

<Toast.Group {toaster}>
	{#snippet children(toast)}
		<Toast {toast}>
			<Toast.Message>
				<Toast.Title>{toast.title}</Toast.Title>
				<Toast.Description>{toast.description}</Toast.Description>
			</Toast.Message>
			<Toast.CloseTrigger />
		</Toast>
	{/snippet}
</Toast.Group>
{@render children()}
