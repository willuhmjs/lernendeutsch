<script lang="ts">
	let { data } = $props();
	let myGames = $derived(data.myGames);
	let communityGames = $derived(data.communityGames);
</script>

<div class="games-container max-w-5xl mx-auto p-4 md:p-8">
	<div class="header-section flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
		<div>
			<h1 class="text-3xl font-extrabold text-gray-900 dark:text-white">Games Gallery</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-2">Create, edit, and play language learning games.</p>
		</div>
		<a href="/games/create" class="btn-primary px-6 py-3 rounded-xl font-bold text-lg shadow-sm">
			+ Create Game
		</a>
	</div>

	<div class="mb-12">
		<h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
			<svg class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
			</svg>
			My Games
		</h2>
		
		{#if myGames.length === 0}
			<div class="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
				<p class="text-gray-500 dark:text-gray-400 mb-4">You haven't created any games yet.</p>
				<a href="/games/create" class="text-blue-500 font-bold hover:underline">Create your first game</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each myGames as game}
					<div class="card-duo flex flex-col h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 transition-transform hover:-translate-y-1 hover:shadow-lg">
						<div class="flex-1">
							<div class="flex justify-between items-start mb-3">
								<h3 class="font-bold text-xl text-gray-900 dark:text-white line-clamp-1">{game.title}</h3>
								<span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold rounded text-gray-600 dark:text-gray-300 uppercase tracking-wider">
									{game.language}
								</span>
							</div>
							<p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 h-10">
								{game.description || 'No description provided.'}
							</p>
							<div class="flex items-center gap-4 text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">
								<span class="flex items-center gap-1">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									{game._count.questions} questions
								</span>
								<span class="flex items-center gap-1">
									{#if game.isPublished}
										<span class="text-green-500 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span> Published</span>
									{:else}
										<span class="text-gray-400 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-gray-400"></span> Draft</span>
									{/if}
								</span>
							</div>
						</div>
						<div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
							<a href="/games/{game.id}/edit" class="flex-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-bold py-2 px-4 rounded-xl text-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
								Edit
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div>
		<h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
			<svg class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
			</svg>
			Community Games
		</h2>
		
		{#if communityGames.length === 0}
			<div class="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border-2 border-gray-200 dark:border-gray-700">
				<p class="text-gray-500 dark:text-gray-400">No community games available right now.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each communityGames as game}
					<div class="card-duo flex flex-col h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 transition-transform hover:-translate-y-1 hover:shadow-lg">
						<div class="flex-1">
							<div class="flex justify-between items-start mb-3">
								<h3 class="font-bold text-xl text-gray-900 dark:text-white line-clamp-1">{game.title}</h3>
								<span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold rounded text-gray-600 dark:text-gray-300 uppercase tracking-wider">
									{game.language}
								</span>
							</div>
							<p class="text-sm font-semibold text-blue-500 mb-2">by {game.creator?.username || 'Unknown'}</p>
							<p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4 h-10">
								{game.description || 'No description provided.'}
							</p>
							<div class="flex items-center gap-4 text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">
								<span class="flex items-center gap-1">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
									{game._count.questions} questions
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
