<script lang="ts">
	let { data } = $props();
	let languages = $derived(data.languages);
	let isSubmitting = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;
		
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		
		try {
			const res = await fetch('/api/games', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: formData.get('title'),
					description: formData.get('description'),
					language: formData.get('language')
				})
			});
			
			if (res.ok) {
				const data = await res.json();
				window.location.href = `/games/${data.game.id}/edit`;
			} else {
				console.error('Failed to create game');
				isSubmitting = false;
			}
		} catch (error) {
			console.error('Error:', error);
			isSubmitting = false;
		}
	}
</script>

<div class="max-w-2xl mx-auto p-4 md:p-8">
	<div class="mb-8">
		<a href="/games" class="text-blue-500 hover:underline flex items-center gap-1 font-bold mb-4">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
			Back to Games
		</a>
		<h1 class="text-3xl font-extrabold text-gray-900 dark:text-white">Create New Game</h1>
		<p class="text-gray-600 dark:text-gray-400 mt-2">Set up the basic details for your new language game.</p>
	</div>

	<div class="card-duo bg-white dark:bg-gray-800">
		<form onsubmit={handleSubmit} class="space-y-6">
			<div>
				<label for="title" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Title <span class="text-red-500">*</span></label>
				<input
					type="text"
					id="title"
					name="title"
					required
					placeholder="e.g. Basic French Greetings"
					class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all font-semibold"
				/>
			</div>

			<div>
				<label for="description" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
				<textarea
					id="description"
					name="description"
					rows="3"
					placeholder="Optional context or instructions..."
					class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all font-semibold"
				></textarea>
			</div>

			<div>
				<label for="language" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Language <span class="text-red-500">*</span></label>
				<select
					id="language"
					name="language"
					required
					class="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all font-semibold appearance-none"
				>
					<option value="" disabled selected>Select a language...</option>
					{#each languages as lang}
						<option value={lang.name}>{lang.name}</option>
					{/each}
				</select>
			</div>

			<div class="pt-4 border-t border-gray-100 dark:border-gray-700">
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full btn-primary py-4 rounded-xl font-bold text-lg shadow-sm flex items-center justify-center gap-2 {isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}"
				>
					{#if isSubmitting}
						<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Creating Game...
					{:else}
						Create & Continue to Editor
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
