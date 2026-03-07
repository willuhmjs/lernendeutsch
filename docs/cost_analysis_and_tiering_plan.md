# Cost Analysis & Tiering Plan

## 1. Current Compute Constraints in the Application

Based on an analysis of the new operational model, our primary constraint is no longer per-token API costs (as GPU compute is now completely free). Instead, the challenge is **managing limited compute bandwidth and concurrency**.

1. **Strict Provisioning Limits (The Bottleneck):**
   - We are limited to **exactly 1 instance running on 2x RTX 6000 Ada Generation GPUs**.
   - This provides a total of **96GB of VRAM**.
   - The application relies heavily on Large Language Models (LLMs) via the `generateChatCompletion` function (`src/lib/server/llm.ts`).
   - Features consuming LLM compute include:
     - **Lesson Generation:** `src/routes/api/generate-lesson/+server.ts`
     - **Chat Practice:** `src/routes/api/chat/+server.ts`
     - **Answer Evaluation (Grader):** `src/routes/api/submit-answer/+server.ts`
     - **Dictionary/Vocabulary Lookups:** `src/routes/api/vocabulary/llm-lookup/+server.ts`
     - **Onboarding and Normalization:** `src/routes/api/onboarding/+server.ts`
     - **Admin Auto-Review Tools:** `src/routes/api/admin/vocabulary/ai-review/+server.ts`
   - Unbounded or high-frequency usage of these endpoints can cause severe queueing and timeouts, degrading the experience for all users.

2. **Database & Hosting (Fixed/Scaling Cost):**
   - **Database:** PostgreSQL is used via Prisma (`prisma/schema.prisma`). High read/write throughput (e.g., tracking every user vocabulary progress update, chat messages) will require scaling the DB.
   - **Hosting:** The project is containerized (`docker-compose.yml`, `kubernetes.yaml`), implying cloud VM or managed Kubernetes costs.

## 2. Strategies to Manage Compute Bandwidth

To ensure the application remains responsive and stable on a single GPU instance, we must implement the following strategies:

- **Queueing and Priority:** Implement a strict request queue. Premium users (`.edu` emails) get priority access, moving to the front of the queue to ensure faster response times. Non-premium users are processed with lower priority.
- **Model Selection for Self-Hosting:** With 96GB of VRAM, we have choices:
  - Run a single, highly capable quantized model (e.g., Llama-3-70B, Q4 or Q8 quantized) to handle all requests.
  - Run multiple smaller models (e.g., Llama-3-8B) to increase concurrency.
  - _Recommendation:_ Run a single instance of a high-quality quantized model (like Llama-3-70B-Instruct) to ensure the best educational quality, relying on queueing and caching to manage load.
- **Concurrency Limits (Rate Limiting):** Introduce strict concurrency and rate limits for non-premium users to prevent them from hogging the GPU queue.
- **Batching / Caching:** For deterministic requests (like vocabulary lookup, translations, or standard grammar explanations), cache the LLM response in the database or Redis so subsequent identical requests completely bypass the GPU.
- **Encourage BYOK (Bring Your Own Key):** Continue to support custom `llmBaseUrl` and `llmApiKey`. Prompt heavy non-premium users to provide their own API keys (e.g., OpenAI, Anthropic) to bypass our local GPU queue entirely.

## 3. Implementing Premium Tier Logic (.edu Emails)

We will define "Premium" status dynamically based on the user's email domain.

**Implementation Steps:**

1. **Helper Function:** Create a utility function (e.g., in `src/lib/server/premium.ts` or `src/auth.ts`) to check if a user is premium:
   ```typescript
   export function isPremiumUser(email: string | null | undefined): boolean {
   	if (!email) return false;
   	return email.trim().toLowerCase().endsWith('.edu');
   }
   ```
2. **Session Context:** Attach this `isPremium` boolean to the user's session in `src/hooks.server.ts` so it is readily available in `locals.user` across all API routes and UI components.

## 4. Applying Different Strategies (Premium vs. Non-Premium)

With the tiering logic in place, we will differentiate the user experience and backend processing:

### A. Queue Priority and Processing

Update the LLM processing pipeline (e.g., in `src/lib/server/llm.ts` or a dedicated queue worker):

- **Premium Users (`.edu`):** Requests are enqueued with `HIGH` priority.
- **Non-Premium Users:** Requests are enqueued with `LOW` priority.
  _Note: If a non-premium user provides their own API key (BYOK), their requests skip the local queue and go directly to their specified provider._

### B. Tiered Concurrency and Rate Limits

Refactor `src/lib/server/ratelimit.ts` to heavily restrict free users from blocking the GPU queue:

- **Chat Practice:**
  - Non-premium: 5 messages/hour
  - Premium: 50 messages/hour
- **Generate Lesson:**
  - Non-premium: 1 lesson/day
  - Premium: 20 lessons/day

### C. Feature Gating

- Limit non-premium users to a certain number of AI evaluations or chat practice sessions.
- Show an upsell/informational banner to non-premium users: _"Experiencing slow responses? Our servers are currently under heavy load. Unlock priority queue access by signing up with a .edu email, or provide your own API key in Settings to bypass the queue entirely."_
