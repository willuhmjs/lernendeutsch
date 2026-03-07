<script lang="ts">
	import toast from 'svelte-french-toast';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	let game = $derived(data.game);

	// Game Details Editing State
	let isEditingDetails = $state(false);
	let editTitle = $state(game.title);
	let editDescription = $state(game.description || '');
	let isPublished = $state(game.isPublished);

	// Generating State
	let isGenerating = $state(false);
	let generateTopic = $state('');
	let generateCount = $state(5);

	// Question State
	let newQuestion = $state('');
	let newAnswer = $state('');
	let newOptions = $state(['', '', '']);
	let isAddingQuestion = $state(false);

	// Form Submission Functions
	async function saveGameDetails() {
		try {
			const res = await fetch(`/api/games/${game.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: editTitle,
					description: editDescription,
					isPublished
				})
			});
			if (res.ok) {
				toast.success('Game details updated!');
				isEditingDetails = false;
				await invalidateAll();
			} else {
				toast.error('Failed to update game details');
			}
		} catch (error) {
			toast.error('Error updating game');
		}
	}

	async function togglePublish() {
		isPublished = !isPublished;
		await saveGameDetails();
	}

	async function deleteGame() {
		if (!confirm('Are you sure you want to delete this game? This cannot be undone.')) return;
		try {
			const res = await fetch(`/api/games/${game.id}`, { method: 'DELETE' });
			if (res.ok) {
				window.location.href = '/games';
			} else {
				toast.error('Failed to delete game');
			}
		} catch (error) {
			toast.error('Error deleting game');
		}
	}

	async function generateQuestions() {
		if (!generateTopic) {
			toast.error('Please enter a topic');
			return;
		}
		isGenerating = true;
		toast.loading('Generating questions...', { id: 'gen' });

		try {
			const res = await fetch(`/api/games/${game.id}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					topic: generateTopic,
					questionCount: generateCount,
					difficulty: 'beginner'
				})
			});

			if (res.ok) {
				toast.success('Questions generated successfully!', { id: 'gen' });
				generateTopic = '';
				await invalidateAll();
			} else {
				toast.error('Failed to generate questions', { id: 'gen' });
			}
		} catch (error) {
			toast.error('Error generating questions', { id: 'gen' });
		} finally {
			isGenerating = false;
		}
	}

	async function addQuestion() {
		if (!newQuestion || !newAnswer) {
			toast.error('Question and Answer are required');
			return;
		}
		
		const options = newOptions.filter(o => o.trim() !== '');
		
		try {
			const res = await fetch(`/api/games/${game.id}/questions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					question: newQuestion,
					answer: newAnswer,
					options: options.length > 0 ? options : undefined
				})
			});

			if (res.ok) {
				toast.success('Question added!');
				newQuestion = '';
				newAnswer = '';
				newOptions = ['', '', ''];
				isAddingQuestion = false;
				await invalidateAll();
			} else {
				toast.error('Failed to add question');
			}
		} catch (error) {
			toast.error('Error adding question');
		}
	}

	async function deleteQuestion(questionId: string) {
		if (!confirm('Delete this question?')) return;
		try {
			const res = await fetch(`/api/games/${game.id}/questions/${questionId}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				toast.success('Question deleted');
				await invalidateAll();
			} else {
				toast.error('Failed to delete question');
			}
		} catch (error) {
			toast.error('Error deleting question');
		}
	}
</script>

<div class="max-w-4xl mx-auto p-4 md:p-8">
	<div class="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<a href="/games" class="text-blue-500 hover:underline flex items-center gap-1 font-bold mb-2">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
				Back to Games
			</a>
			<h1 class="text-3xl font-extrabold text-gray-900 dark:text-white">Game Editor</h1>
		</div>
		<div class="flex items-center gap-3">
			<button onclick={togglePublish} class="px-4 py-2 rounded-xl font-bold text-sm {isPublished ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'} transition-colors">
				{isPublished ? 'Published' : 'Draft'}
			</button>
			<button onclick={deleteGame} class="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 font-bold rounded-xl hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
				Delete Game
			</button>
		</div>
	</div>

	<!-- Game Details Section -->
	<div class="card-duo bg-white dark:bg-gray-800 mb-8 p-6">
		<div class="flex justify-between items-start mb-4">
			<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
				<svg class="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
				Game Details
			</h2>
			<button onclick={() => isEditingDetails = !isEditingDetails} class="text-blue-500 hover:underline font-bold text-sm">
				{isEditingDetails ? 'Cancel' : 'Edit'}
			</button>
		</div>

		{#if isEditingDetails}
			<div class="space-y-4 mt-4">
				<div>
					<label for="title" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Title</label>
					<input type="text" id="title" bind:value={editTitle} class="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold" />
				</div>
				<div>
					<label for="description" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
					<textarea id="description" bind:value={editDescription} rows="2" class="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"></textarea>
				</div>
				<button onclick={saveGameDetails} class="btn-primary py-2 px-6 rounded-xl font-bold">Save Details</button>
			</div>
		{:else}
			<div>
				<h3 class="text-2xl font-bold text-gray-900 dark:text-white">{game.title}</h3>
				<span class="inline-block mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-bold rounded text-gray-600 dark:text-gray-300 uppercase tracking-wider">
					{game.language}
				</span>
				<p class="mt-3 text-gray-600 dark:text-gray-400 font-semibold">
					{game.description || 'No description provided.'}
				</p>
			</div>
		{/if}
	</div>

	<!-- AI Generation Section -->
	<div class="card-duo bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-8 p-6">
		<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-4">
			<svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
			Auto-Generate Questions
		</h2>
		<p class="text-sm text-gray-600 dark:text-gray-400 mb-4 font-semibold">
			Use AI to instantly create vocabulary or grammar questions for this game.
		</p>
		<div class="flex flex-col sm:flex-row gap-3">
			<input 
				type="text" 
				bind:value={generateTopic} 
				placeholder="Topic (e.g., 'Food and drinks', 'Past tense verbs')" 
				class="flex-1 px-4 py-3 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
				disabled={isGenerating}
			/>
			<div class="flex gap-3">
				<select bind:value={generateCount} disabled={isGenerating} class="w-24 px-4 py-3 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold appearance-none text-center">
					<option value={5}>5 Qs</option>
					<option value={10}>10 Qs</option>
					<option value={15}>15 Qs</option>
				</select>
				<button 
					onclick={generateQuestions} 
					disabled={isGenerating || !generateTopic}
					class="btn-primary py-3 px-6 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap {isGenerating ? 'opacity-70 cursor-not-allowed' : ''}"
				>
					{isGenerating ? 'Generating...' : 'Generate AI'}
				</button>
			</div>
		</div>
	</div>

	<!-- Questions List -->
	<div class="mb-4 flex justify-between items-center">
		<h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
			<svg class="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			Questions ({game.questions.length})
		</h2>
		<button onclick={() => isAddingQuestion = !isAddingQuestion} class="text-blue-500 font-bold hover:underline flex items-center gap-1">
			{isAddingQuestion ? 'Cancel' : '+ Add Manual Question'}
		</button>
	</div>

	{#if isAddingQuestion}
		<div class="card-duo bg-white dark:bg-gray-800 mb-6 border-dashed border-gray-400">
			<h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200">New Question</h3>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Question prompt <span class="text-red-500">*</span></label>
					<input type="text" bind:value={newQuestion} placeholder="e.g. Translate 'Hello'" class="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold" />
				</div>
				<div>
					<label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Correct Answer <span class="text-red-500">*</span></label>
					<input type="text" bind:value={newAnswer} placeholder="e.g. Bonjour" class="w-full px-3 py-2 rounded-lg border-2 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-gray-900 dark:text-white focus:outline-none focus:border-green-500 font-semibold" />
				</div>
				<div>
					<label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Incorrect Options (Optional)</label>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
						<input type="text" bind:value={newOptions[0]} placeholder="Distractor 1" class="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold" />
						<input type="text" bind:value={newOptions[1]} placeholder="Distractor 2" class="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold" />
						<input type="text" bind:value={newOptions[2]} placeholder="Distractor 3" class="w-full px-3 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold" />
					</div>
				</div>
				<button onclick={addQuestion} class="btn-primary py-2 px-6 rounded-xl font-bold mt-2">Save Question</button>
			</div>
		</div>
	{/if}

	<div class="space-y-4">
		{#if game.questions.length === 0 && !isAddingQuestion}
			<div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
				<p class="text-gray-500 dark:text-gray-400 font-semibold mb-2">No questions yet.</p>
				<p class="text-sm text-gray-400">Use the AI generator above or add a manual question.</p>
			</div>
		{/if}

		{#each game.questions as question, i}
			<div class="card-duo bg-white dark:bg-gray-800 p-5 flex flex-col md:flex-row gap-4 relative">
				<div class="absolute top-4 right-4 flex gap-2">
					<button onclick={() => deleteQuestion(question.id)} class="text-gray-400 hover:text-red-500 transition-colors" title="Delete Question">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
					</button>
				</div>
				
				<div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 font-bold flex items-center justify-center">
					{i + 1}
				</div>
				
				<div class="flex-1 pr-8">
					<h4 class="font-bold text-lg text-gray-900 dark:text-white mb-2">{question.question}</h4>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
						<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 px-3 flex items-center gap-2">
							<svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
							<span class="font-semibold text-green-800 dark:text-green-300 text-sm">{question.answer}</span>
						</div>
						
						{#if question.options && Array.isArray(question.options)}
							{#each question.options as opt}
								<div class="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-2 px-3 flex items-center gap-2">
									<svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
									<span class="font-semibold text-gray-600 dark:text-gray-300 text-sm">{opt}</span>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
