<script lang="ts">
	import Sidebar from './sidebar.svelte';
	import Canvas from './canvas.svelte';
	import ToolRail from './tool_rail.svelte';
	import LayersPanel from './layers_panel.svelte';
	import PlacementToolbar from './placement_toolbar.svelte';
	import StatusBar from './status_bar.svelte';
	import EmptyState from './empty_state.svelte';
</script>

<div class="flex flex-row h-0 grow">
	<ToolRail />
	<div class="relative flex flex-col grow min-w-0">
		<div class="relative grow min-h-0">
			<Canvas />
			<EmptyState />
			<LayersPanel />
			<PlacementToolbar />
		</div>
		<StatusBar />
	</div>
	<Sidebar />
</div>
