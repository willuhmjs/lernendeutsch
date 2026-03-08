<script lang="ts">
	import { modal } from '$lib/modal.svelte';
	import { fade, scale } from 'svelte/transition';

	let modalState = $derived(modal.current);
</script>

{#if modalState}
	<div
		class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		on:click={() => modalState?.type === 'alert' || modalState?.type === 'confirm' ? null : modal.close(false)}
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col items-center text-center mx-auto absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
			transition:scale={{ duration: 200, start: 0.95 }}
			on:click|stopPropagation
		>
			<div class="p-6">
				{#if modalState.title}
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						{modalState.title}
					</h3>
				{/if}
				<p class="text-gray-600 dark:text-gray-300">
					{modalState.message}
				</p>
			</div>

			<div class="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 w-full">
				{#if modalState.type === 'confirm'}
					<button
						type="button"
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
						on:click={() => modal.close(false)}
					>
						{modalState.cancelText || 'Cancel'}
					</button>
				{/if}

				<button
					type="button"
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
					on:click={() => modal.close(true)}
				>
					{modalState.confirmText || 'OK'}
				</button>
			</div>
		</div>
	</div>
{/if}
