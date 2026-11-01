<script lang="ts">
	import type { Step } from '$lib/models/step';
	import {
		CAP_STYLE,
		tool_pairs,
		ToolId,
		ToolSettingId,
		type Tool,
	} from '$lib/models/tool';
	import { get_editor } from '$lib/editor.svelte';
	import Slider from '$lib/components/slider.svelte';
	import { Portal, Switch, Tooltip } from '@skeletonlabs/skeleton-svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { Icons } from '$lib/components/icons';
	import SectionHeader from '$lib/components/section_header.svelte';
	import { Record } from 'effect';
	import { is_canvas_filter_supported } from '$lib/canvas';
	import { ui } from '$lib/ui.svelte';
	import AdvancedHint from './advanced_hint.svelte';

	type Props = {
		step: Step;
	};
	const { step }: Props = $props();

	const editor = get_editor();

	function on_value_change(tool_id: ToolId, setting: ToolSettingId) {
		return (value: number) => {
			editor().update_tool_settings(tool_id, {
				...editor().tool_settings[tool_id],
				[setting]: value,
			});
		};
	}
</script>

{#if ui.advanced}
	<div class="flex flex-wrap gap-1">
		{#each tool_pairs.filter((tool_pair) => tool_pair.step === step) as tool_pair (tool_pair.id)}
			{@const Icon = Icons[tool_pair.icon]}
			{@const active =
				tool_pair.primary.id === editor().primary_tool_id ||
				tool_pair.secondary.id === editor().primary_tool_id}
			<button
				type="button"
				class={[
					'flex items-center gap-1.5 h-8 px-2 rounded-md border text-xs transition-all',
					active ?
						'border-primary-500 bg-primary-500/12 text-primary-500 shadow-[0_0_14px_-6px_rgba(229,50,45,0.9)]'
					:	'border-surface-200-800 text-surface-700-300 hover:border-surface-400-600',
				]}
				title="{t(tool_pair.name)} ({tool_pair.key})"
				onclick={() => {
					editor().primary_tool_id = tool_pair.primary.id;
					editor().secondary_tool_id = tool_pair.secondary.id;
				}}
			>
				<Icon class="size-3.5" />
				<span class="font-mono text-[0.6rem] opacity-60">{tool_pair.key}</span>
			</button>
		{/each}
	</div>
{/if}

{#snippet settings(tool: Tool)}
	<header class="flex gap-2 items-baseline">
		<h3 class="inline font-bold text-surface-900-100">{t(tool.name)}</h3>
		<em class="text-xs text-surface-600-400 not-italic font-mono">
			{#if tool.id === editor().secondary_tool_id}{t('shift')}+{/if}{t(
				'click',
			)}{#if tool.action_type !== 'single_point' || editor().tool_settings[tool.id].bulk === 1}+{t(
					'drag',
				)}{/if}
		</em>
		<div class="grow"></div>
		<Tooltip positioning={{ placement: 'top' }}>
			<Tooltip.Trigger
				class="btn btn-icon p-0 size-5 relative top-2 text-tertiary-700-300"
				onclick={() => {
					const primary = editor().secondary_tool_id;
					const secondary = editor().primary_tool_id;
					editor().primary_tool_id = primary;
					editor().secondary_tool_id = secondary;
				}}
			>
				<Icons.ArrowDownUp size={20} />
			</Tooltip.Trigger>
			<Portal>
				<Tooltip.Positioner>
					<Tooltip.Content class="card p-2 preset-filled-surface-950-50">
						<span>{t('Swap Primary/Secondary')} (X)</span>
						<Tooltip.Arrow
							class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]"
						>
							<Tooltip.ArrowTip />
						</Tooltip.Arrow>
					</Tooltip.Content>
				</Tooltip.Positioner>
			</Portal>
		</Tooltip>
		{#if !Record.isEmptyRecord(tool.default_settings)}
			<Tooltip positioning={{ placement: 'top' }}>
				<Tooltip.Trigger
					class="btn btn-icon p-0 size-5 relative top-2 text-tertiary-700-300"
					onclick={() => {
						editor().update_tool_settings(tool.id, {
							...editor().tool_settings[tool.id],
							...tool.default_settings,
						});
					}}
				>
					<Icons.RotateCcw size={20} />
				</Tooltip.Trigger>
				<Portal>
					<Tooltip.Positioner>
						<Tooltip.Content class="card p-2 preset-filled-surface-950-50">
							<span>{t('Reset Settings')}</span>
							<Tooltip.Arrow
								class="[--arrow-size:--spacing(2)] [--arrow-background:var(--color-surface-950-50)]"
							>
								<Tooltip.ArrowTip />
							</Tooltip.Arrow>
						</Tooltip.Content>
					</Tooltip.Positioner>
				</Portal>
			</Tooltip>
		{/if}
	</header>

	{#if tool.description}
		<p class="text-sm text-surface-900-100">{t(tool.description)}</p>
	{/if}

	{#if 'cap_style' in tool.default_settings}
		<label>
			<span class="label-text">{t('Cap Style')}</span>
			<select
				class="select ring-surface-300-700 bg-surface-100-900"
				value={editor().tool_settings[tool.id].cap_style}
				onchange={(e) =>
					on_value_change(
						tool.id,
						'cap_style',
					)(Number.parseInt(e.currentTarget.value))}
			>
				<option value={CAP_STYLE.butt}>{t('Butt')}</option>
				<option value={CAP_STYLE.bevel}>{t('Bevel')}</option>
				<option value={CAP_STYLE.round}>{t('Round')}</option>
			</select>
		</label>
	{/if}

	{#if 'size' in tool.default_settings}
		<Slider
			min={0}
			max={500}
			step={1}
			value={editor().tool_settings[tool.id].size}
			on_value_change={on_value_change(tool.id, 'size')}
		>
			{#snippet label()}{t(tool.size_label ?? 'Size')}{/snippet}
		</Slider>
	{/if}

	{#if 'sides' in tool.default_settings}
		<Slider
			min={tool.id.startsWith('spiral') ? 1 : 3}
			max={tool.id.startsWith('spiral') ? 8 : 16}
			step={1}
			value={editor().tool_settings[tool.id].sides}
			on_value_change={on_value_change(tool.id, 'sides')}
		>
			{#snippet label()}{t(
					tool.id.startsWith('spiral') ? 'Arms'
					: tool.id.startsWith('star') ? 'Points'
					: 'Sides',
				)}{/snippet}
		</Slider>
	{/if}

	{#if 'inner_ratio' in tool.default_settings}
		<Slider
			min={0.1}
			max={0.9}
			step={0.05}
			value={editor().tool_settings[tool.id].inner_ratio}
			on_value_change={on_value_change(tool.id, 'inner_ratio')}
		>
			{#snippet label()}{t('Inner Radius')}{/snippet}
			{#snippet output(value)}{Math.round(value * 100)}%{/snippet}
		</Slider>
	{/if}

	{#if 'turns' in tool.default_settings}
		<Slider
			min={0.1}
			max={2.5}
			step={0.05}
			value={editor().tool_settings[tool.id].turns}
			on_value_change={on_value_change(tool.id, 'turns')}
		>
			{#snippet label()}{t('Twist')}{/snippet}
			{#snippet output(value)}{value} {t('turns')}{/snippet}
		</Slider>
	{/if}

	{#if 'opacity' in tool.default_settings}
		<Slider
			min={0}
			max={1}
			step={0.01}
			value={editor().tool_settings[tool.id].opacity}
			on_value_change={on_value_change(tool.id, 'opacity')}
		>
			{#snippet label()}{t('Strength')}{/snippet}
			{#snippet output(value)}{Math.round(value * 100)}%{/snippet}
		</Slider>
	{/if}

	{#if 'blur' in tool.default_settings && is_canvas_filter_supported()}
		<Slider
			min={0}
			max={2}
			step={0.1}
			value={editor().tool_settings[tool.id].blur}
			on_value_change={on_value_change(tool.id, 'blur')}
		>
			{#snippet label()}{t('Blur')}{/snippet}
			{#snippet output(value)}{value}x{/snippet}
		</Slider>
	{/if}

	{#if 'bulk' in tool.default_settings}
		<Switch
			checked={editor().tool_settings[tool.id].bulk === 1}
			onCheckedChange={(details) =>
				editor().update_tool_settings(tool.id, {
					...editor().tool_settings[tool.id],
					bulk: details.checked ? 1 : 0,
				})}
		>
			<Switch.Control>
				<Switch.Thumb />
			</Switch.Control>
			<Switch.Label class="flex gap-1">{t('Bulk Mode')}</Switch.Label>
			<Switch.HiddenInput />
		</Switch>
	{/if}

	{#if 'bulk_brush_size' in tool.default_settings && editor().tool_settings[tool.id].bulk === 1}
		<Slider
			min={0}
			max={500}
			step={1}
			value={editor().tool_settings[tool.id].bulk_brush_size}
			on_value_change={on_value_change(tool.id, 'bulk_brush_size')}
		>
			{#snippet label()}{t('Bulk Brush Size')}{/snippet}
		</Slider>
	{/if}
{/snippet}

{#if ui.advanced}
	<SectionHeader>{t('Primary')}</SectionHeader>
	{@render settings(editor().primary_tool)}

	<SectionHeader>{t('Secondary')}</SectionHeader>
	{@render settings(editor().secondary_tool)}
{:else}
	{@render settings(editor().primary_tool)}
	<p class="text-xs text-surface-500 flex items-center gap-1.5">
		<span class="sf-kbd">Shift</span>
		{t('click')}: {t(editor().secondary_tool.name)}
	</p>
{/if}
<AdvancedHint />
