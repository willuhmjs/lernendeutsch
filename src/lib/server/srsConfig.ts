/**
 * Centralized configuration for Spaced Repetition System (SRS) and CEFR level progression.
 * All tuning parameters are defined here for easy adjustment and consistency.
 */

// ELO Rating System Configuration
export const ELO_CONFIG = {
	// K-factor determines how much ratings change per game
	K_FACTOR: 96,

	// K-factor multipliers by game mode (affects learning evidence weight)
	K_MULTIPLIERS: {
		MULTIPLE_CHOICE: 0.5, // Recognition tasks provide less evidence
		TARGET_TO_NATIVE: 0.5, // Translation from target to native (recognition)
		NATIVE_TO_TARGET: 1.2, // Production into target language (most difficult)
		FILL_BLANK: 1.0, // Default multiplier
	},

	// Default starting ELO ratings
	DEFAULT_ELO: 1000,
} as const;

// CEFR Level Configuration
export const CEFR_CONFIG = {
	// CEFR level names in order
	LEVELS: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const,

	// Base ELO difficulty for each CEFR level (used for vocabulary/grammar)
	BASE_ELO: {
		A1: 1000,
		A2: 1200,
		B1: 1400,
		B2: 1600,
		C1: 1800,
		C2: 2000,
	} as const,

	// Target average ELO to advance to next level
	ELO_TARGETS: {
		A1: 1150,
		A2: 1350,
		B1: 1550,
		B2: 1750,
		C1: 1950,
	} as const,

	// Minimum percentage of items at a level that must be interacted with (not UNSEEN)
	MIN_EXPOSURE_PERCENT: 0.6,

	// Minimum percentage of items that must be KNOWN or MASTERED to level up
	MASTERY_THRESHOLD: 0.8,

	// ELO decay configuration (for items not reviewed recently)
	DECAY: {
		THRESHOLD_DAYS: 30, // Items not reviewed for this many days will decay
		RATE: 0.05, // 5% decay toward baseline per decay period
	},
} as const;

// SM-2 Algorithm Configuration (Spaced Repetition)
export const SM2_CONFIG = {
	// Default ease factor for new items
	DEFAULT_EASE_FACTOR: 2.5,

	// Minimum allowed ease factor
	MIN_EASE_FACTOR: 1.3,

	// Initial intervals (in days) for successful reviews
	INTERVALS: {
		FIRST_SUCCESS: 1, // After first correct answer
		SECOND_SUCCESS: 6, // After second consecutive correct answer
	},

	// Grace rating threshold (SM-2 uses 0-5 scale, we convert our 0-1 scores)
	// Scores >= 0.6 (which becomes grade 3) count as successful
	SUCCESS_GRADE_THRESHOLD: 3,
} as const;

// SRS State Thresholds
export const SRS_STATE_CONFIG = {
	// Minimum consecutive correct answers to reach KNOWN state
	KNOWN_THRESHOLD: 2,

	// Minimum interval (days) to reach MASTERED state
	MASTERED_INTERVAL_DAYS: 21, // 3 weeks
} as const;

// XP Rewards Configuration
export const XP_CONFIG = {
	// XP awarded for correct answers by game mode
	CORRECT_ANSWER: {
		MULTIPLE_CHOICE: 5, // Easier mode = less XP
		OTHER_MODES: 10, // Translation, fill-in-blank, etc.
	},

	// Minimum score threshold to earn XP
	SCORE_THRESHOLD: 0.8, // 80% or higher
} as const;

// Gamification Configuration
export const GAMIFICATION_CONFIG = {
	// Throttle for lastActive updates (milliseconds)
	LAST_ACTIVE_THROTTLE_MS: 5 * 60 * 1000, // 5 minutes
} as const;

// Type exports for TypeScript
export type CefrLevel = (typeof CEFR_CONFIG.LEVELS)[number];
export type GameMode = keyof typeof ELO_CONFIG.K_MULTIPLIERS;
