<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	let createName = '';
	let createDescription = '';
	let isCreating = false;
	let createError = '';

	let joinCode = '';
	let isJoining = false;
	let joinError = '';

	async function handleCreate() {
		if (!createName) return;
		isCreating = true;
		createError = '';

		try {
			const res = await fetch('/api/classes/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: createName, description: createDescription })
			});
			const result = await res.json();
			if (!res.ok) {
				createError = result.error || 'Failed to create class';
			} else {
				createName = '';
				createDescription = '';
				await invalidateAll();
			}
		} catch (e) {
			createError = 'An error occurred';
		} finally {
			isCreating = false;
		}
	}

	async function handleJoin() {
		if (!joinCode) return;
		isJoining = true;
		joinError = '';

		try {
			const res = await fetch('/api/classes/join', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ inviteCode: joinCode })
			});
			const result = await res.json();
			if (!res.ok) {
				joinError = result.error || 'Failed to join class';
			} else {
				joinCode = '';
				await invalidateAll();
			}
		} catch (e) {
			joinError = 'An error occurred';
		} finally {
			isJoining = false;
		}
	}
</script>

<svelte:head>
	<title>My Classes - LernenDeutsch</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-4 space-y-8">
	<h1 class="text-4xl font-extrabold text-gray-800 text-center mb-8">Classes</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
		<!-- Create Class Form -->
		<div class="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100 flex flex-col">
			<h2 class="text-2xl font-bold text-gray-800 mb-4">Create a Class</h2>
			<form on:submit|preventDefault={handleCreate} class="space-y-4 flex-grow flex flex-col">
				<div>
					<label for="name" class="block text-sm font-bold text-gray-700 mb-1">Class Name</label>
					<input
						type="text"
						id="name"
						bind:value={createName}
						placeholder="e.g. German 101"
						class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
						required
					/>
				</div>
				<div>
					<label for="description" class="block text-sm font-bold text-gray-700 mb-1">Description (Optional)</label>
					<input
						type="text"
						id="description"
						bind:value={createDescription}
						placeholder="What is this class about?"
						class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
					/>
				</div>
				{#if createError}
					<p class="text-red-500 font-bold text-sm">{createError}</p>
				{/if}
				<div class="mt-auto pt-4">
					<button
						type="submit"
						disabled={isCreating || !createName}
						class="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_rgb(37,99,235)] active:shadow-[0_0px_0_rgb(37,99,235)] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
					>
						{isCreating ? 'Creating...' : 'Create Class'}
					</button>
				</div>
			</form>
		</div>

		<!-- Join Class Form -->
		<div class="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100 flex flex-col">
			<h2 class="text-2xl font-bold text-gray-800 mb-4">Join a Class</h2>
			<form on:submit|preventDefault={handleJoin} class="space-y-4 flex-grow flex flex-col">
				<div>
					<label for="inviteCode" class="block text-sm font-bold text-gray-700 mb-1">Invite Code</label>
					<input
						type="text"
						id="inviteCode"
						bind:value={joinCode}
						placeholder="Enter 6-character code"
						class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors uppercase"
						required
					/>
				</div>
				{#if joinError}
					<p class="text-red-500 font-bold text-sm">{joinError}</p>
				{/if}
				<div class="mt-auto pt-4">
					<button
						type="submit"
						disabled={isJoining || !joinCode}
						class="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_rgb(22,163,74)] active:shadow-[0_0px_0_rgb(22,163,74)] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
					>
						{isJoining ? 'Joining...' : 'Join Class'}
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- List of Classes -->
	<div class="mt-12">
		<h2 class="text-3xl font-extrabold text-gray-800 mb-6">My Classes</h2>
		
		{#if data.classes && data.classes.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each data.classes as cls}
					<a
						href="/classes/{cls.id}"
						class="block bg-white rounded-2xl shadow-md border-2 border-gray-100 p-6 hover:-translate-y-[2px] hover:shadow-lg transition-all cursor-pointer group"
					>
						<h3 class="text-xl font-bold text-gray-800 group-hover:text-blue-500 transition-colors mb-2">{cls.name}</h3>
						{#if cls.description}
							<p class="text-gray-600 mb-4 line-clamp-2">{cls.description}</p>
						{/if}
						<div class="flex justify-between items-center text-sm font-bold text-gray-500">
							<span class="flex items-center gap-1">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
									<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
								</svg>
								{cls.members.length} member{cls.members.length === 1 ? '' : 's'}
							</span>
							<span class="flex items-center gap-1">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
									<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
									<path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
								</svg>
								{cls.assignments.length} assignment{cls.assignments.length === 1 ? '' : 's'}
							</span>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300">
				<p class="text-xl font-bold text-gray-500">You haven't joined any classes yet.</p>
				<p class="text-gray-400 mt-2">Create a new class or join an existing one using an invite code!</p>
			</div>
		{/if}
	</div>
</div>
