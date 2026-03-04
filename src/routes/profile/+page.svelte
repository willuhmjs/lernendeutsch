<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	export let form;
</script>

<div class="profile-container">
	<header class="profile-header">
		<h1>Profile</h1>
		<p>Manage your account settings.</p>
	</header>

	<section class="info-card">
		<h2>Your Information</h2>
		<div class="info-grid">
			<div class="info-item">
				<span class="info-label">Username</span>
				<span class="info-value">{data.user?.username}</span>
			</div>
			<div class="info-item">
				<span class="info-label">CEFR Level</span>
				<span class="info-value level-badge">{data.user?.cefrLevel}</span>
			</div>
			<div class="info-item">
				<span class="info-label">Role</span>
				<span class="info-value">{data.user?.role}</span>
			</div>
		</div>
	</section>

	<section class="password-card">
		<h2>Update Password</h2>

		{#if form?.error}
			<div class="alert alert-error">{form.error}</div>
		{/if}
		{#if form?.success}
			<div class="alert alert-success">{form.success}</div>
		{/if}

		<form method="POST" action="?/updatePassword">
			{#if data.hasPassword}
				<div class="form-group">
					<label for="currentPassword">Current Password</label>
					<input type="password" id="currentPassword" name="currentPassword" required />
				</div>
			{/if}

			<div class="form-group">
				<label for="newPassword">New Password</label>
				<input type="password" id="newPassword" name="newPassword" required minlength="8" />
			</div>

			<button type="submit" class="submit-btn">Update Password</button>
		</form>
	</section>
</div>

<style>
	.profile-container {
		max-width: 640px;
		margin: 0 auto;
		color: #334155;
	}

	.profile-header {
		margin-bottom: 2rem;
	}

	.profile-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.profile-header p {
		color: #6b7280;
		margin: 0;
	}

	.info-card,
	.password-card {
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.info-card h2,
	.password-card h2 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 1.25rem 0;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 1rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.info-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9ca3af;
	}

	.info-value {
		font-size: 1rem;
		font-weight: 500;
		color: #111827;
	}

	.level-badge {
		display: inline-block;
		background-color: #dbeafe;
		color: #2563eb;
		padding: 0.1rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
		width: fit-content;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.alert-success {
		background-color: #ecfdf5;
		color: #065f46;
		border: 1px solid #a7f3d0;
	}

	.alert-error {
		background-color: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.375rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #111827;
		background: #ffffff;
		transition: border-color 0.2s, box-shadow 0.2s;
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.submit-btn {
		background-color: #2563eb;
		color: white;
		border: none;
		padding: 0.625rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.2s;
		margin-top: 0.5rem;
	}

	.submit-btn:hover {
		background-color: #1d4ed8;
	}
</style>