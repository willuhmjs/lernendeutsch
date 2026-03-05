<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	$: classDetails = data.classDetails;
	$: currentUserRole = data.currentUserRole;

	// Assignment Creation
	let createAssignmentMode = 'VERB_CONJUGATION';
	let createAssignmentTargetScore = 50;
	let isCreatingAssignment = false;
	let assignmentError = '';

	async function handleCreateAssignment() {
		isCreatingAssignment = true;
		assignmentError = '';

		try {
			const res = await fetch(`/api/classes/${classDetails.id}/assignments`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					gamemode: createAssignmentMode,
					targetScore: createAssignmentTargetScore
				})
			});
			const result = await res.json();
			if (!res.ok) {
				assignmentError = result.error || 'Failed to create assignment';
			} else {
				await invalidateAll();
			}
		} catch (e) {
			assignmentError = 'An error occurred';
		} finally {
			isCreatingAssignment = false;
		}
	}

	async function handlePromoteMember(userId: string) {
		try {
			const res = await fetch(`/api/classes/${classDetails.id}/members/${userId}/promote`, {
				method: 'POST'
			});
			if (res.ok) {
				await invalidateAll();
			} else {
				alert('Failed to promote member.');
			}
		} catch (e) {
			alert('An error occurred.');
		}
	}

	function formatDate(dateString: string | Date) {
		return new Date(dateString).toLocaleDateString();
	}
</script>

<svelte:head>
	<title>{classDetails.name} - LernenDeutsch</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-4 space-y-8">
	<!-- Class Header -->
	<div class="bg-blue-500 rounded-2xl p-8 shadow-md text-white flex flex-col md:flex-row md:justify-between md:items-center gap-6">
		<div>
			<h1 class="text-4xl font-extrabold mb-2">{classDetails.name}</h1>
			{#if classDetails.description}
				<p class="text-blue-100 text-lg">{classDetails.description}</p>
			{/if}
		</div>
		<div class="bg-white/20 p-4 rounded-xl text-center min-w-[200px]">
			<p class="text-blue-100 font-bold text-sm uppercase tracking-wider mb-1">Invite Code</p>
			<p class="text-3xl font-mono font-bold tracking-widest">{classDetails.inviteCode}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Main Content: Assignments -->
		<div class="lg:col-span-2 space-y-8">
			<div class="flex justify-between items-center">
				<h2 class="text-3xl font-extrabold text-gray-800">Assignments</h2>
			</div>

			<!-- Create Assignment Form (TEACHER only) -->
			{#if currentUserRole === 'TEACHER'}
				<div class="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100 mb-6">
					<h3 class="text-xl font-bold text-gray-800 mb-4">Create New Assignment</h3>
					<form on:submit|preventDefault={handleCreateAssignment} class="flex flex-col md:flex-row gap-4 items-end">
						<div class="flex-grow">
							<label for="gamemode" class="block text-sm font-bold text-gray-700 mb-1">Game Mode</label>
							<select
								id="gamemode"
								bind:value={createAssignmentMode}
								class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors font-bold text-gray-700 bg-white"
							>
								<option value="VERB_CONJUGATION">Verb Conjugation</option>
								<option value="MULTIPLE_CHOICE">Multiple Choice</option>
								<option value="FILL_IN_THE_BLANK">Fill in the Blank</option>
							</select>
						</div>
						<div class="w-full md:w-32">
							<label for="targetScore" class="block text-sm font-bold text-gray-700 mb-1">Target Score</label>
							<input
								type="number"
								id="targetScore"
								bind:value={createAssignmentTargetScore}
								min="1"
								class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors font-bold text-gray-700"
							/>
						</div>
						<button
							type="submit"
							disabled={isCreatingAssignment}
							class="w-full md:w-auto bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_0_rgb(22,163,74)] active:shadow-[0_0px_0_rgb(22,163,74)] active:translate-y-1 transition-all disabled:opacity-50"
						>
							{isCreatingAssignment ? 'Creating...' : 'Create'}
						</button>
					</form>
					{#if assignmentError}
						<p class="text-red-500 font-bold text-sm mt-2">{assignmentError}</p>
					{/if}
				</div>
			{/if}

			<!-- Assignments List -->
			{#if classDetails.assignments.length > 0}
				<div class="space-y-4">
					{#each classDetails.assignments as assignment}
						<div class="bg-white p-6 rounded-2xl shadow-md border-2 border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:-translate-y-[2px] hover:shadow-lg transition-all group">
							<div>
								<h4 class="text-xl font-bold text-gray-800 group-hover:text-blue-500 transition-colors">
									{assignment.gamemode.replace(/_/g, ' ')} Practice
								</h4>
								<p class="text-gray-500 font-bold text-sm mt-1">
									Target Score: {assignment.targetScore} • Added {formatDate(assignment.createdAt)}
								</p>
							</div>
							<a
								href="/play?mode={assignment.gamemode.toLowerCase()}&assignmentId={assignment.id}"
								class="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-[0_4px_0_rgb(37,99,235)] active:shadow-[0_0px_0_rgb(37,99,235)] active:translate-y-1 transition-all text-center inline-block"
							>
								Play Now
							</a>
						</div>
					{/each}
				</div>
			{:else}
				<div class="bg-gray-50 rounded-2xl p-8 text-center border-2 border-dashed border-gray-300">
					<p class="text-xl font-bold text-gray-500">No assignments yet.</p>
					<p class="text-gray-400 mt-2">Check back later for new practice tasks!</p>
				</div>
			{/if}
		</div>

		<!-- Sidebar: Members -->
		<div class="space-y-6">
			<h2 class="text-2xl font-extrabold text-gray-800">Members ({classDetails.members.length})</h2>
			<div class="bg-white rounded-2xl shadow-md border-2 border-gray-100 overflow-hidden">
				<ul class="divide-y-2 divide-gray-100">
					{#each classDetails.members as member}
						<li class="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
							<div class="flex items-center gap-3">
								<div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
									{member.user.name?.charAt(0) || member.user.username.charAt(0)}
								</div>
								<div>
									<p class="font-bold text-gray-800">
										{member.user.name || member.user.username}
										{#if member.userId === data.user?.id}
											<span class="text-gray-400 font-normal text-sm ml-1">(You)</span>
										{/if}
									</p>
									<p class="text-xs font-bold uppercase tracking-wider {member.role === 'TEACHER' ? 'text-purple-500' : 'text-gray-500'}">
										{member.role}
									</p>
								</div>
							</div>
							{#if currentUserRole === 'TEACHER' && member.role !== 'TEACHER'}
								<button
									on:click={() => handlePromoteMember(member.userId)}
									class="text-xs font-bold text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
								>
									Promote
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</div>
