<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();
	
	let activeTab: 'classes' | 'games' = $state('classes');

	let myGames = $derived(data.myGames);
	let communityGames = $derived(data.communityGames);

	let createName = $state('');
	let createDescription = $state('');
	let createLanguage = $state('international');
	let isCreating = $state(false);
	let createError = $state('');

	let joinCode = $state('');
	let isJoining = $state(false);
	let joinError = $state('');

	onMount(() => {
		const codeParam = $page.url.searchParams.get('code');
		if (codeParam) {
			joinCode = codeParam;
			handleJoin();
		}
	});

	async function handleCreate() {
		if (!createName) return;
		isCreating = true;
		createError = '';

		try {
			const res = await fetch('/api/classes/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: createName,
					description: createDescription,
					primaryLanguage: createLanguage
				})
			});
			const result = await res.json();
			if (!res.ok) {
				createError = result.error || 'Failed to create class';
			} else {
				createName = '';
				createDescription = '';
				createLanguage = 'international';
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
	<title>My Classes - LingoLearn</title>
</svelte:head>

<div class="classes-container">
	<header class="classes-header" in:fly={{ y: 20, duration: 400 }}>
		<h1>Classes & Games</h1>
		<p>Manage your classes or discover language games.</p>
	</header>

	<div class="tabs-container" in:fly={{ y: 20, duration: 400 }}>
		<div class="tabs">
			<button class="tab-btn" class:active={activeTab === 'classes'} onclick={() => activeTab = 'classes'}>
				Classes
			</button>
			<button class="tab-btn" class:active={activeTab === 'games'} onclick={() => activeTab = 'games'}>
				Games
			</button>
		</div>
	</div>

	{#if activeTab === 'classes'}
	<div class="forms-grid" in:fly={{ y: 20, duration: 400, delay: 100 }}>
		<!-- Create Class Form -->
		<div class="card-duo form-card create-card">
			<div class="card-header">
				<div class="icon-wrapper create-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
				</div>
				<h2>Create a Class</h2>
				<p class="card-subtitle">Start a new learning group</p>
			</div>
			<form onsubmit={(e) => { e.preventDefault(); handleCreate(); }} class="form-inner">
				<div class="field">
					<label for="name">Class Name</label>
					<div class="input-wrapper">
						<input
							type="text"
							id="name"
							bind:value={createName}
							placeholder="e.g. German 101"
							required
							disabled={isCreating}
						/>
					</div>
				</div>
				<div class="field">
					<label for="description">Description <span class="optional">(Optional)</span></label>
					<div class="input-wrapper">
						<textarea
							id="description"
							bind:value={createDescription}
							placeholder="What is this class about?"
							rows="2"
							disabled={isCreating}
						></textarea>
					</div>
				</div>
				<div class="field">
					<label for="language">Primary Language</label>
					<div class="input-wrapper select-wrapper">
						<select id="language" bind:value={createLanguage} disabled={isCreating}>
							<option value="international">🌍 International</option>
							<option value="de">🇩🇪 German</option>
							<option value="es">🇪🇸 Spanish</option>
							<option value="fr">🇫🇷 French</option>
						</select>
					</div>
				</div>
				{#if createError}
					<div class="form-error">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						{createError}
					</div>
				{/if}
				<div class="form-actions">
					<button
						type="submit"
						disabled={isCreating || !createName}
						class="btn-duo btn-primary btn-full"
					>
						{isCreating ? 'Creating...' : 'Create Class'}
					</button>
				</div>
			</form>
		</div>

		<!-- Join Class Form -->
		<div class="card-duo form-card join-card">
			<div class="card-header">
				<div class="icon-wrapper join-icon">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
				</div>
				<h2>Join a Class</h2>
				<p class="card-subtitle">Enter a code from your teacher</p>
			</div>
			<form onsubmit={(e) => { e.preventDefault(); handleJoin(); }} class="form-inner">
				<div class="field">
					<label for="inviteCode">Invite Code</label>
					<div class="code-input-container">
						<input
							type="text"
							id="inviteCode"
							bind:value={joinCode}
							placeholder="------"
							class="invite-code-input"
							maxlength="6"
							required
							autocomplete="off"
							disabled={isJoining}
						/>
						<div class="code-format-hint">6 alphanumeric characters</div>
					</div>
				</div>
				{#if joinError}
					<div class="form-error">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						{joinError}
					</div>
				{/if}
				<div class="form-actions">
					<button
						type="submit"
						disabled={isJoining || joinCode.length < 6}
						class="btn-duo btn-join btn-full"
					>
						{isJoining ? 'Joining...' : 'Join Class'}
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- List of Classes -->
	<section class="my-classes-section" in:fly={{ y: 20, duration: 400, delay: 200 }}>
		<h2 class="section-title">My Classes</h2>

		{#if data.classes && data.classes.length > 0}
			<div class="classes-grid">
				{#each data.classes as cls}
					<a href="/classes/{cls.id}" class="card-duo class-card">
						<h3 class="class-card-name">{cls.name}</h3>
						{#if cls.description}
							<p class="class-card-desc">{cls.description}</p>
						{:else}
							<div class="class-card-spacer"></div>
						{/if}
						<div class="class-card-meta">
							<span class="meta-item">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
									<path
										d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
									/>
								</svg>
								{cls.members.length} members
							</span>
							<span class="meta-item">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H7z"
										clip-rule="evenodd"
									/>
								</svg>
								{cls.assignments.length} tasks
							</span>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
					/>
				</svg>
				<p class="empty-title">No classes yet</p>
				<p class="empty-desc">Create a new class or join one using an invite code!</p>
			</div>
		{/if}
	</section>
	{:else}
	<div class="games-wrapper" in:fly={{ y: 20, duration: 400, delay: 100 }}>
		<div class="header-section">
			<h2>Games Gallery</h2>
			<a href="/classes/games/create" class="btn-primary create-btn">
				+ Create Game
			</a>
		</div>

		<div class="games-section">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
				My Games
			</h2>
			
			{#if myGames.length === 0}
				<div class="empty-state">
					<p>You haven't created any games yet.</p>
					<a href="/classes/games/create" class="link">Create your first game</a>
				</div>
			{:else}
				<div class="games-grid">
					{#each myGames as game}
						<div class="card-duo game-card">
							<div class="game-card-content">
								<div class="game-card-header">
									<h3>{game.title}</h3>
									<span class="language-badge">
										{game.language}
									</span>
								</div>
								<p class="game-description">
									{game.description || 'No description provided.'}
								</p>
								<div class="game-meta">
									<span>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
										{game._count.questions} questions
									</span>
									<span>
										{#if game.isPublished}
											<span class="status-published"><span class="status-dot published-dot"></span> Published</span>
										{:else}
											<span class="status-draft"><span class="status-dot draft-dot"></span> Draft</span>
										{/if}
									</span>
								</div>
							</div>
							<div class="game-actions">
								<a href="/classes/games/{game.id}/learn" class="btn-action">
									Learn
								</a>
								<a href="/classes/games/{game.id}/edit" class="btn-action">
									Edit
								</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="games-section">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
				</svg>
				Community Games
			</h2>
			
			{#if communityGames.length === 0}
				<div class="empty-state">
					<p>No community games available right now.</p>
				</div>
			{:else}
				<div class="games-grid">
					{#each communityGames as game}
						<div class="card-duo game-card">
							<div class="game-card-content">
								<div class="game-card-header">
									<h3>{game.title}</h3>
									<span class="language-badge">
										{game.language}
									</span>
								</div>
								<p class="game-author">by {game.creator?.username || 'Unknown'}</p>
								<p class="game-description">
									{game.description || 'No description provided.'}
								</p>
								<div class="game-meta">
									<span>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
										{game._count.questions} questions
									</span>
								</div>
							</div>
							<div class="game-actions">
								<a href="/classes/games/{game.id}/learn" class="btn-action">
									Learn
								</a>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
	{/if}
</div>

<style>
	.tabs-container {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.tabs {
		display: flex;
		background: #f1f5f9;
		padding: 0.5rem;
		border-radius: 1rem;
		gap: 0.5rem;
	}

	.tab-btn {
		padding: 0.75rem 2rem;
		border-radius: 0.75rem;
		font-weight: bold;
		font-size: 1rem;
		color: #64748b;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab-btn:hover {
		color: #1e293b;
		background: #e2e8f0;
	}

	.tab-btn.active {
		background: white;
		color: #3b82f6;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	.games-wrapper {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.header-section {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.header-section {
			flex-direction: row;
			align-items: center;
		}
	}

	.header-section h2 {
		font-size: 2rem;
		color: var(--text-color, #0f172a);
		margin: 0;
		font-weight: 800;
	}

	.create-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.75rem;
		font-weight: bold;
		text-decoration: none;
		display: inline-block;
	}

	.games-section {
		margin-bottom: 1rem;
	}

	.games-section h2 {
		font-size: 1.5rem;
		color: var(--text-color, #1e293b);
		margin: 0 0 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.games-section h2 svg {
		width: 1.5rem;
		height: 1.5rem;
		color: #3b82f6;
	}

	.link {
		color: #3b82f6;
		font-weight: bold;
		text-decoration: none;
	}

	.link:hover {
		text-decoration: underline;
	}

	.game-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.game-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
	}

	.game-card-content {
		flex: 1;
		padding: 1.5rem;
	}

	.game-card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.game-card-header h3 {
		font-size: 1.25rem;
		font-weight: bold;
		margin: 0;
		color: var(--text-color, #1e293b);
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.language-badge {
		background: #f1f5f9;
		color: #475569;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.game-author {
		font-size: 0.875rem;
		font-weight: bold;
		color: #3b82f6;
		margin: 0 0 0.5rem;
	}

	.game-description {
		color: #64748b;
		font-size: 0.875rem;
		margin: 0 0 1rem;
		height: 2.5rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.game-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		font-weight: bold;
		color: #64748b;
	}

	.game-meta span {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.game-meta svg {
		width: 1rem;
		height: 1rem;
	}

	.status-published {
		color: #22c55e;
	}

	.status-draft {
		color: #94a3b8;
	}

	.status-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		display: inline-block;
	}

	.published-dot {
		background-color: #22c55e;
	}

	.draft-dot {
		background-color: #94a3b8;
	}

	.game-actions {
		padding: 1rem;
		border-top: 1px solid var(--card-border, #f1f5f9);
		display: flex;
		gap: 0.75rem;
	}

	.btn-action {
		flex: 1;
		background: #eff6ff;
		color: #1d4ed8;
		font-weight: bold;
		padding: 0.5rem 1rem;
		border-radius: 0.75rem;
		text-align: center;
		text-decoration: none;
		transition: background-color 0.2s;
	}

	.btn-action:hover {
		background: #dbeafe;
	}

	:global(.btn-success) {
		background-color: #22c55e;
		color: white;
		border-color: transparent;
		box-shadow: 0 4px 0 #16a34a;
	}
	:global(.btn-success:hover) {
		background-color: #4ade80;
		transform: scale(1.02);
	}
	:global(.btn-success:active) {
		transform: scale(0.98) translateY(2px);
		box-shadow: 0 2px 0 #16a34a;
	}

	:global(.btn-join) {
		background-color: #a855f7;
		color: white;
		border-color: transparent;
		box-shadow: 0 4px 0 #9333ea;
	}
	:global(.btn-join:hover:not(:disabled)) {
		background-color: #c084fc;
		transform: scale(1.02);
	}
	:global(.btn-join:active:not(:disabled)) {
		transform: scale(0.98) translateY(2px);
		box-shadow: 0 2px 0 #9333ea;
	}
	:global(.btn-join:disabled) {
		background-color: #e5e7eb;
		color: #9ca3af;
		box-shadow: 0 4px 0 #d1d5db;
		cursor: not-allowed;
		transform: none;
	}

	:global(.btn-primary:disabled) {
		background-color: #e5e7eb;
		color: #9ca3af;
		box-shadow: 0 4px 0 #d1d5db;
		cursor: not-allowed;
		transform: none;
	}

	:global(.btn-full) {
		width: 100%;
	}

	.classes-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.classes-header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.classes-header h1 {
		font-size: 2.5rem;
		color: var(--text-color, #0f172a);
		margin: 0 0 0.5rem;
	}

	.classes-header p {
		color: #64748b;
		font-size: 1.1rem;
		margin: 0;
	}

	.forms-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		margin-bottom: 3rem;
	}

	@media (min-width: 768px) {
		.forms-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.form-card {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.create-card {
		border-top: 6px solid #22c55e;
	}

	.join-card {
		border-top: 6px solid #a855f7;
	}

	.card-header {
		text-align: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px dashed var(--card-border, #e2e8f0);
	}

	.icon-wrapper {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
	}

	.icon-wrapper svg {
		width: 2rem;
		height: 2rem;
		stroke-width: 2.5;
	}

	.create-icon {
		background-color: #dcfce7;
		color: #16a34a;
	}

	.join-icon {
		background-color: #f3e8ff;
		color: #9333ea;
	}

	.form-card h2 {
		font-size: 1.5rem;
		color: var(--text-color, #1e293b);
		margin: 0 0 0.25rem;
		border: none;
		padding: 0;
	}

	.card-subtitle {
		color: #64748b;
		font-size: 0.95rem;
		margin: 0;
	}

	.form-inner {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		gap: 1.25rem;
	}

	.field label {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		font-weight: 800;
		color: #475569;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.field label .optional {
		color: #94a3b8;
		font-weight: 600;
	}

	.input-wrapper {
		position: relative;
	}

	.field input,
	.field textarea,
	.field select {
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		border: 2px solid var(--card-border, #e5e7eb);
		background-color: var(--input-bg, #ffffff);
		color: var(--text-color, #1e293b);
		font-family: inherit;
		font-size: 1rem;
		font-weight: 700;
		transition: all 0.2s;
		box-sizing: border-box;
		outline: none;
	}

	.field input:focus,
	.field textarea:focus,
	.field select:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
	}

	.create-card .field input:focus,
	.create-card .field textarea:focus,
	.create-card .field select:focus {
		border-color: #22c55e;
		box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
	}

	.join-card .field input:focus {
		border-color: #a855f7;
		box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1);
	}

	.field textarea {
		resize: none;
	}

	.select-wrapper::after {
		content: '';
		position: absolute;
		right: 1.25rem;
		top: 50%;
		transform: translateY(-50%);
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 6px solid #64748b;
		pointer-events: none;
	}

	.field select {
		appearance: none;
		padding-right: 2.5rem;
	}

	.code-input-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.invite-code-input {
		text-align: center;
		font-size: 1.75rem !important;
		font-weight: 900 !important;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		padding: 1rem !important;
		color: #7e22ce !important;
		background-color: #faf5ff !important;
		border-color: #e9d5ff !important;
	}

	.invite-code-input::placeholder {
		color: #d8b4fe;
		letter-spacing: 0.3em;
	}

	.code-format-hint {
		text-align: center;
		font-size: 0.8rem;
		color: #94a3b8;
		font-weight: 600;
	}

	.form-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: #fef2f2;
		color: #ef4444;
		font-weight: 700;
		font-size: 0.875rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		border: 2px solid #fecaca;
		margin: 0;
	}

	.form-error svg {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
	}

	.form-actions {
		margin-top: auto;
		padding-top: 1rem;
	}

	.my-classes-section {
		margin-top: 1rem;
	}

	.section-title {
		font-size: 1.75rem;
		color: var(--text-color, #0f172a);
		margin: 0 0 1.5rem;
		border-bottom: 2px solid var(--card-border, #e2e8f0);
		padding-bottom: 0.5rem;
	}

	.classes-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.classes-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (min-width: 1024px) {
		.classes-grid {
			grid-template-columns: 1fr 1fr 1fr;
		}
	}

	.class-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
	}

	.class-card-name {
		font-size: 1.2rem;
		color: var(--text-color, #1e293b);
		margin: 0 0 0.5rem;
		transition: color 0.2s;
	}

	.class-card:hover .class-card-name {
		color: #3b82f6;
	}

	.class-card-desc {
		color: #64748b;
		font-size: 0.95rem;
		margin: 0 0 1.25rem;
		flex-grow: 1;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.class-card-spacer {
		flex-grow: 1;
	}

	.class-card-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1rem;
		border-top: 2px solid var(--card-border, #e5e7eb);
		font-size: 0.8rem;
		font-weight: 800;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.meta-item svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 2rem;
		background: var(--card-bg, #f8fafc);
		border-radius: 1.5rem;
		border: 3px dashed var(--card-border, #cbd5e1);
		color: #94a3b8;
	}

	.empty-state svg {
		width: 4rem;
		height: 4rem;
		margin: 0 auto 1rem;
		opacity: 0.5;
	}

	.empty-title {
		font-size: 1.25rem;
		font-weight: 800;
		color: #64748b;
		margin: 0 0 0.5rem;
	}

	.empty-desc {
		color: #94a3b8;
		margin: 0;
		font-size: 0.95rem;
	}

	@media (max-width: 768px) {
		.classes-container {
			padding: 1rem 0.5rem;
		}

		.classes-header h1 {
			font-size: 2rem;
		}

		.btn-duo {
			width: 100%;
			box-sizing: border-box;
		}
	}
</style>
