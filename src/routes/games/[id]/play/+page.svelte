<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	export let data: PageData;

	let currentQuestionIndex = 0;
	let score = 0;
	let isGameOver = false;
	let selectedOption: string | null = null;
	let isAnswerCorrect: boolean | null = null;
	let showResult = false;

	$: game = data.game;
	$: questions = game.questions || [];
	$: currentQuestion = questions[currentQuestionIndex];
	$: options = Array.isArray(currentQuestion?.options) 
		? currentQuestion.options 
		: (typeof currentQuestion?.options === 'string' 
			? JSON.parse(currentQuestion.options) 
			: []);

	function selectOption(option: string) {
		if (showResult) return;

		selectedOption = option;
		isAnswerCorrect = option === currentQuestion.answer;
		if (isAnswerCorrect) {
			score++;
		}
		showResult = true;
	}

	function nextQuestion() {
		if (currentQuestionIndex < questions.length - 1) {
			currentQuestionIndex++;
			selectedOption = null;
			isAnswerCorrect = null;
			showResult = false;
		} else {
			isGameOver = true;
		}
	}
</script>

<div class="container mx-auto max-w-2xl px-4 py-8">
	{#if isGameOver}
		<div class="rounded-lg bg-base-200 p-8 text-center shadow-sm">
			<h1 class="mb-4 text-4xl font-bold">Game Over!</h1>
			<p class="mb-8 text-2xl">
				Your Score: {score} / {questions.length}
			</p>
			<a href="/games" class="btn btn-primary">Return to Games</a>
		</div>
	{:else if currentQuestion}
		<div class="mb-8 text-center">
			<h1 class="mb-2 text-3xl font-bold">{game.title}</h1>
			<div class="badge badge-neutral mb-4">Question {currentQuestionIndex + 1} of {questions.length}</div>
		</div>

		<div class="rounded-lg bg-base-200 p-6 shadow-sm">
			<h2 class="mb-6 text-xl font-semibold text-center">{currentQuestion.question}</h2>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each options as option}
					<button
						class="btn h-auto min-h-[4rem] text-lg p-4 normal-case {showResult && option === currentQuestion.answer ? 'btn-success' : showResult && option === selectedOption && option !== currentQuestion.answer ? 'btn-error' : 'btn-outline'}"
						on:click={() => selectOption(option)}
						disabled={showResult}
					>
						{option}
					</button>
				{/each}
			</div>

			{#if showResult}
				<div class="mt-8 text-center">
					<div class="mb-4 text-xl font-bold">
						{#if isAnswerCorrect}
							<span class="text-success">Correct!</span>
						{:else}
							<span class="text-error">Incorrect!</span> The correct answer is {currentQuestion.answer}.
						{/if}
					</div>
					<button class="btn btn-primary" on:click={nextQuestion}>
						{currentQuestionIndex === questions.length - 1 ? 'Finish Game' : 'Next Question'}
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<div class="text-center">
			<h1 class="text-2xl font-bold mb-4">No questions available for this game.</h1>
			<a href="/games" class="btn btn-primary">Return to Games</a>
		</div>
	{/if}
</div>
