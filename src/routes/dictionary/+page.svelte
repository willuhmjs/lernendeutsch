<script lang="ts">
	import { fade } from 'svelte/transition';

	let query = '';
	let results: any[] = [];
	let loading = false;
	let debounceTimer: ReturnType<typeof setTimeout>;

	// Keep track of which words have been added in this session
	let addedWords = new Set<string>();

	async function performSearch(q: string) {
		if (!q.trim()) {
			results = [];
			return;
		}

		loading = true;
		try {
			const res = await fetch(`/api/vocabulary/search?q=${encodeURIComponent(q)}`);
			if (res.ok) {
				const data = await res.json();
				results = data.results;
			}
		} catch (error) {
			console.error('Search failed:', error);
		} finally {
			loading = false;
		}
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			performSearch(query);
		}, 300);
	}

	async function handleAddWord(vocabularyId: string) {
		try {
			const res = await fetch('/api/user/vocabulary', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ vocabularyId })
			});

			if (res.ok) {
				// Update local state to show it was added
				addedWords = new Set(addedWords).add(vocabularyId);
			} else {
				console.error('Failed to add word');
			}
		} catch (error) {
			console.error('Error adding word:', error);
		}
	}
</script>

<svelte:head>
	<title>Dictionary - LernenDeutsch</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Dictionary</h1>
		<p class="text-gray-600 dark:text-gray-400">Search for words and add them to your learning list.</p>
	</div>

	<div class="mb-8">
		<div class="relative">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
				</svg>
			</div>
			<input
				type="search"
				bind:value={query}
				on:input={handleInput}
				class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
				placeholder="Search for words in German or English..."
			/>
			{#if loading}
				<div class="absolute inset-y-0 right-0 flex items-center pr-3">
					<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-gray-900 dark:border-white"></div>
				</div>
			{/if}
		</div>
	</div>

	{#if results.length > 0}
		<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800" transition:fade>
			<ul class="divide-y divide-gray-200 dark:divide-gray-700">
				{#each results as result}
					<li class="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
									{result.lemma}
									{#if result.gender}
										<span class="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
											{result.gender.toLowerCase()}
										</span>
									{/if}
								</h3>
								<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
									{result.meaning}
								</p>
								{#if result.partOfSpeech}
									<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
										{result.partOfSpeech}
									</p>
								{/if}
							</div>
							
							<div>
								{#if addedWords.has(result.id)}
									<button
										disabled
										class="inline-flex items-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-700 focus:outline-none dark:bg-green-900 dark:text-green-300 cursor-not-allowed"
									>
										Added
									</button>
								{:else}
									<button
										on:click={() => handleAddWord(result.id)}
										class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
									>
										Add
									</button>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{:else if query.trim() && !loading}
		<div class="text-center py-12" transition:fade>
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No words found</h3>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search query.</p>
		</div>
	{/if}
</div>