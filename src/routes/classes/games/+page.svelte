<script lang="ts">
	let { data } = $props();
	let myGames = $derived(data.myGames);
	let communityGames = $derived(data.communityGames);
</script>

<div class="games-container">
	<div class="header-section">
		<div>
			<h1>Games Gallery</h1>
			<p>Create, edit, and learn language learning games.</p>
		</div>
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

<style>
	.games-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	.header-section {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.header-section {
			flex-direction: row;
			align-items: center;
		}
	}

	.header-section h1 {
		font-size: 2.5rem;
		color: var(--text-color, #0f172a);
		margin: 0 0 0.5rem;
		font-weight: 800;
	}

	.header-section p {
		color: #64748b;
		margin: 0;
	}

	.create-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.75rem;
		font-weight: bold;
		text-decoration: none;
		display: inline-block;
	}

	.games-section {
		margin-bottom: 3rem;
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

	.empty-state {
		background: var(--card-bg, #f8fafc);
		border-radius: 1.5rem;
		border: 2px dashed var(--card-border, #cbd5e1);
		padding: 3rem 2rem;
		text-align: center;
	}

	.empty-state p {
		color: #64748b;
		margin: 0 0 1rem;
	}

	.link {
		color: #3b82f6;
		font-weight: bold;
		text-decoration: none;
	}

	.link:hover {
		text-decoration: underline;
	}

	.games-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.games-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	@media (min-width: 1024px) {
		.games-grid {
			grid-template-columns: 1fr 1fr 1fr;
		}
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
</style>
