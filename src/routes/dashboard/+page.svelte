<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	// SrsState enum values from Prisma schema
	const srsColors = {
		UNSEEN: 'var(--color-unseen, #e2e8f0)', // gray-200
		LEARNING: 'var(--color-learning, #fef08a)', // yellow-200
		KNOWN: 'var(--color-known, #6ee7b7)', // emerald-300
		MASTERED: 'var(--color-mastered, #10b981)' // emerald-500
	};

	// Summary Statistics Calculations
	const totalVocab = data.vocabularies.length;
	const avgVocabElo = totalVocab > 0 ? Math.ceil(data.vocabularies.reduce((acc, v) => acc + v.eloRating, 0) / totalVocab) : 0;
	const vocabSrsBreakdown = data.vocabularies.reduce((acc, v) => {
		acc[v.srsState] = (acc[v.srsState] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const totalGrammar = data.grammarRules.length;
	const avgGrammarElo = totalGrammar > 0 ? Math.ceil(data.grammarRules.reduce((acc, r) => acc + r.eloRating, 0) / totalGrammar) : 0;
	const grammarSrsBreakdown = data.grammarRules.reduce((acc, r) => {
		acc[r.srsState] = (acc[r.srsState] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);
</script>

<div class="dashboard-container">
	<header class="dashboard-header">
		<h1>Proficiency Dashboard</h1>
		<p>Track your language learning progress.</p>
		<a href="/onboarding" class="re-onboard-link">Retake Placement Test</a>
	</header>

	<section class="summary-section">
		<h2>Summary Statistics</h2>
		<div class="summary-grid">
			<div class="summary-card">
				<h3>Vocabulary</h3>
				<div class="stat-row">
					<span class="stat-label">Total Terms:</span>
					<span class="stat-value">{totalVocab}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Average ELO:</span>
					<span class="stat-value">{avgVocabElo}</span>
				</div>
				<div class="srs-breakdown">
					<h4>SRS State Breakdown</h4>
					{#each Object.entries(srsColors) as [state, color]}
						<div class="breakdown-row">
							<div class="breakdown-label">
								<span class="color-box" style="background-color: {color}"></span>
								{state}
							</div>
							<span>{vocabSrsBreakdown[state] || 0}</span>
						</div>
					{/each}
				</div>
			</div>
			<div class="summary-card">
				<h3>Grammar</h3>
				<div class="stat-row">
					<span class="stat-label">Total Rules:</span>
					<span class="stat-value">{totalGrammar}</span>
				</div>
				<div class="stat-row">
					<span class="stat-label">Average ELO:</span>
					<span class="stat-value">{avgGrammarElo}</span>
				</div>
				<div class="srs-breakdown">
					<h4>SRS State Breakdown</h4>
					{#each Object.entries(srsColors) as [state, color]}
						<div class="breakdown-row">
							<div class="breakdown-label">
								<span class="color-box" style="background-color: {color}"></span>
								{state}
							</div>
							<span>{grammarSrsBreakdown[state] || 0}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<div class="dashboard-content">
		<section class="vocabulary-section">
			<h2>Vocabulary Heatmap</h2>
			<div class="heatmap-legend">
				<div class="legend-item">
					<span class="color-box" style="background-color: {srsColors.UNSEEN}"></span> Unseen
				</div>
				<div class="legend-item">
					<span class="color-box" style="background-color: {srsColors.LEARNING}"></span> Learning
				</div>
				<div class="legend-item">
					<span class="color-box" style="background-color: {srsColors.KNOWN}"></span> Known
				</div>
				<div class="legend-item">
					<span class="color-box" style="background-color: {srsColors.MASTERED}"></span> Mastered
				</div>
			</div>
			
			{#if data.vocabularies.length === 0}
				<p class="empty-state">No vocabulary data available yet. Start learning!</p>
			{:else}
				<div class="heatmap-grid">
					{#each data.vocabularies as vocab}
						<div 
							class="heatmap-cell tooltip-trigger" 
							style="background-color: {srsColors[vocab.srsState]}"
						>
							<span class="sr-only">{vocab.vocabulary.lemma}</span>
							<div class="tooltip-content">
								<div class="tooltip-header">
									{#if vocab.vocabulary.partOfSpeech?.toLowerCase() === 'noun'}
										{vocab.vocabulary.lemma.charAt(0).toUpperCase() + vocab.vocabulary.lemma.slice(1)}
									{:else}
										{vocab.vocabulary.lemma}
									{/if}
								</div>
								<div class="tooltip-body">
									{#if vocab.vocabulary.partOfSpeech}
										<div><strong>POS:</strong> {vocab.vocabulary.partOfSpeech}</div>
									{/if}
									{#if vocab.vocabulary.partOfSpeech?.toLowerCase() === 'noun' && vocab.vocabulary.gender}
										<div><strong>Gender:</strong> {vocab.vocabulary.gender}</div>
									{/if}
									{#if vocab.vocabulary.plural}
										<div><strong>Plural:</strong> {vocab.vocabulary.plural}</div>
									{/if}
									{#if vocab.vocabulary.meaning}
										<div><strong>Meaning:</strong> {vocab.vocabulary.meaning}</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section class="grammar-section">
			<h2>Grammar Skill Tree</h2>
			{#if data.grammarRules.length === 0}
				<p class="empty-state">No grammar data available yet. Start learning!</p>
			{:else}
				<div class="skill-tree">
					{#each data.grammarRules as rule}
						<div class="skill-node">
							<div class="skill-info">
								<h3>{rule.grammarRule.title}</h3>
								<p class="skill-desc">{rule.grammarRule.description || ''}</p>
								
								<div class="debug-details">
									<div class="debug-grid">
										<div class="debug-item"><strong>SRS State:</strong> {rule.srsState}</div>
										<div class="debug-item"><strong>Raw ELO:</strong> {Math.ceil(rule.eloRating)}</div>
									</div>
								</div>
							</div>
							<div class="skill-progress">
								<div class="progress-labels">
									<span>ELO {Math.ceil(rule.eloRating)}</span>
									<span>{rule.srsState}</span>
								</div>
								<div class="progress-bar-container">
									<!-- Baseline is roughly 1200, max mastery could be around 2000 -->
									<div 
										class="progress-bar-fill"
										style="width: {Math.max(0, Math.min(100, ((rule.eloRating - 1000) / 1000) * 100))}%"
									></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
</div>

<style>
	.dashboard-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
		color: #334155;
	}

	.dashboard-header {
		margin-bottom: 2rem;
		text-align: center;
	}

	.dashboard-header h1 {
		font-size: 2.5rem;
		color: #0f172a;
		margin-bottom: 0.5rem;
	}

	.dashboard-header p {
		color: #64748b;
		font-size: 1.1rem;
		margin-bottom: 1rem;
	}

	.re-onboard-link {
		display: inline-block;
		padding: 0.5rem 1rem;
		background-color: #e2e8f0;
		color: #334155;
		text-decoration: none;
		border-radius: 4px;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.re-onboard-link:hover {
		background-color: #cbd5e1;
	}

	/* Summary Section */
	.summary-section {
		margin-bottom: 3rem;
	}

	.summary-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	@media (min-width: 768px) {
		.summary-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.summary-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.summary-card h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #0f172a;
		font-size: 1.25rem;
		border-bottom: 1px solid #cbd5e1;
		padding-bottom: 0.5rem;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 1.05rem;
	}

	.stat-label {
		color: #475569;
		font-weight: 500;
	}

	.stat-value {
		color: #0f172a;
		font-weight: 600;
	}

	.srs-breakdown {
		margin-top: 1.5rem;
	}

	.srs-breakdown h4 {
		font-size: 1rem;
		color: #334155;
		margin-bottom: 0.75rem;
	}

	.breakdown-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.25rem;
		font-size: 0.9rem;
	}

	.breakdown-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.dashboard-content {
		display: grid;
		grid-template-columns: 1fr;
		gap: 3rem;
	}

	@media (min-width: 1024px) {
		.dashboard-content {
			grid-template-columns: 1fr 1fr;
		}
	}

	h2 {
		font-size: 1.5rem;
		color: #1e293b;
		margin-bottom: 1.5rem;
		border-bottom: 2px solid #e2e8f0;
		padding-bottom: 0.5rem;
	}

	/* Vocabulary Heatmap */
	.heatmap-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-box {
		width: 1rem;
		height: 1rem;
		border-radius: 2px;
		display: inline-block;
		border: 1px solid rgba(0,0,0,0.1);
	}

	.heatmap-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		background: #f8fafc;
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
	}

	.heatmap-cell {
		width: 16px;
		height: 16px;
		border-radius: 3px;
		cursor: help;
		transition: transform 0.1s;
		border: 1px solid rgba(0,0,0,0.05);
	}

	.tooltip-trigger {
		position: relative;
	}

	.tooltip-trigger:hover {
		transform: scale(1.2);
		z-index: 10;
		box-shadow: 0 2px 4px rgba(0,0,0,0.2);
	}

	.tooltip-content {
		visibility: hidden;
		opacity: 0;
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 10px;
		background-color: #1e293b;
		color: #f8fafc;
		text-align: left;
		padding: 0.75rem;
		border-radius: 6px;
		width: max-content;
		min-width: 150px;
		box-shadow: 0 4px 6px rgba(0,0,0,0.3);
		transition: opacity 0.2s, visibility 0.2s;
		z-index: 100;
		pointer-events: none;
	}

	.tooltip-content::after {
		content: "";
		position: absolute;
		top: 100%;
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: #1e293b transparent transparent transparent;
	}

	.tooltip-trigger:hover .tooltip-content {
		visibility: visible;
		opacity: 1;
	}

	.tooltip-header {
		font-weight: bold;
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
		border-bottom: 1px solid #475569;
		padding-bottom: 0.25rem;
	}

	.tooltip-body {
		font-size: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	/* Grammar Skill Tree */
	.skill-tree {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.skill-node {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 1.25rem;
		transition: box-shadow 0.2s;
	}

	.skill-node:hover {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	.skill-info h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		color: #0f172a;
	}

	.skill-desc {
		margin: 0;
		color: #64748b;
		font-size: 0.95rem;
		margin-bottom: 1rem;
	}

	.debug-details {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: #e2e8f0;
		border-radius: 6px;
		font-size: 0.8rem;
		color: #475569;
	}

	.debug-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.5rem;
	}

	.debug-item strong {
		color: #334155;
	}

	.progress-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: #475569;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.progress-bar-container {
		height: 0.75rem;
		background-color: #e2e8f0;
		border-radius: 9999px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background-color: #3b82f6; /* blue-500 */
		border-radius: 9999px;
		transition: width 0.5s ease-out;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background: #f8fafc;
		border-radius: 8px;
		border: 1px dashed #cbd5e1;
		color: #64748b;
	}
</style>
