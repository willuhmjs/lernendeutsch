import { prisma } from './prisma';
import { SrsState } from '@prisma/client';
import { CEFR_CONFIG } from './srsConfig';

export interface LevelUpdate {
  oldLevel: string;
  newLevel: string;
}

export interface CefrProgressDetail {
  currentLevel: string;
  nextLevel: string | null;
  percentComplete: number;
  vocabMastery: number;
  grammarMastery: number;
  vocabExposure: number;
  grammarExposure: number;
  averageElo: number;
  targetElo: number | null;
}

export class CefrService {
  /**
   * Apply ELO decay to items that haven't been reviewed recently.
   * Gradually moves ELO back toward the baseline for the item's CEFR level.
   */
  static async applyEloDecay(userId: string, languageId: string): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CEFR_CONFIG.DECAY.THRESHOLD_DAYS);

    // Decay stale vocabulary
    const staleVocab = await prisma.userVocabulary.findMany({
      where: {
        userId,
        vocabulary: { languageId },
        srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] },
        nextReviewDate: { lt: cutoff }
      },
      include: { vocabulary: { select: { cefrLevel: true } } }
    });

    for (const item of staleVocab) {
      const baseline = CEFR_CONFIG.BASE_ELO[item.vocabulary.cefrLevel as keyof typeof CEFR_CONFIG.BASE_ELO] || CEFR_CONFIG.BASE_ELO.A1;
      if (item.eloRating > baseline) {
        const decayedElo = item.eloRating - (item.eloRating - baseline) * CEFR_CONFIG.DECAY.RATE;
        await prisma.userVocabulary.update({
          where: { id: item.id },
          data: { eloRating: decayedElo }
        });
      }
    }

    // Decay stale grammar
    const staleGrammar = await prisma.userGrammarRule.findMany({
      where: {
        userId,
        grammarRule: { languageId },
        srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] },
        nextReviewDate: { lt: cutoff }
      },
      include: { grammarRule: { select: { level: true } } }
    });

    for (const item of staleGrammar) {
      const baseline = CEFR_CONFIG.BASE_ELO[item.grammarRule.level as keyof typeof CEFR_CONFIG.BASE_ELO] || CEFR_CONFIG.BASE_ELO.A1;
      if (item.eloRating > baseline) {
        const decayedElo = item.eloRating - (item.eloRating - baseline) * CEFR_CONFIG.DECAY.RATE;
        await prisma.userGrammarRule.update({
          where: { id: item.id },
          data: { eloRating: decayedElo }
        });
      }
    }
  }

  static async evaluateLevelUp(userId: string, languageId: string): Promise<LevelUpdate | null> {
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_languageId: { userId, languageId }
      }
    });

    if (!userProgress) return null;

    const currentLevel = userProgress.cefrLevel;
    const currentLevelIndex = CEFR_CONFIG.LEVELS.indexOf(currentLevel);

    if (currentLevelIndex === -1 || currentLevelIndex === CEFR_CONFIG.LEVELS.length - 1) {
      return null;
    }

    const nextLevel = CEFR_CONFIG.LEVELS[currentLevelIndex + 1];
    const targetElo = CEFR_CONFIG.ELO_TARGETS[currentLevel];

    // Apply ELO decay before evaluating
    await this.applyEloDecay(userId, languageId);

    // Count total content at this level
    const [totalVocabCount, totalGrammarCount] = await Promise.all([
      prisma.vocabulary.count({ where: { languageId, cefrLevel: currentLevel } }),
      prisma.grammarRule.count({ where: { languageId, level: currentLevel } })
    ]);

    if (totalVocabCount === 0 && totalGrammarCount === 0) {
      return null;
    }

    // Count user's KNOWN + MASTERED items at current level
    const [masteredVocabCount, masteredGrammarCount] = await Promise.all([
      prisma.userVocabulary.count({
        where: {
          userId,
          vocabulary: { languageId, cefrLevel: currentLevel },
          srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] }
        }
      }),
      prisma.userGrammarRule.count({
        where: {
          userId,
          grammarRule: { languageId, level: currentLevel },
          srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] }
        }
      })
    ]);

    // Content coverage: items the user has interacted with (not UNSEEN)
    const [exposedVocabCount, exposedGrammarCount] = await Promise.all([
      prisma.userVocabulary.count({
        where: {
          userId,
          vocabulary: { languageId, cefrLevel: currentLevel },
          srsState: { not: SrsState.UNSEEN }
        }
      }),
      prisma.userGrammarRule.count({
        where: {
          userId,
          grammarRule: { languageId, level: currentLevel },
          srsState: { not: SrsState.UNSEEN }
        }
      })
    ]);

    // If a category has no content, treat mastery and exposure as met
    const vocabMastery = totalVocabCount > 0 ? masteredVocabCount / totalVocabCount : 1.0;
    const grammarMastery = totalGrammarCount > 0 ? masteredGrammarCount / totalGrammarCount : 1.0;
    const vocabExposure = totalVocabCount > 0 ? exposedVocabCount / totalVocabCount : 1.0;
    const grammarExposure = totalGrammarCount > 0 ? exposedGrammarCount / totalGrammarCount : 1.0;

    // Average ELO for KNOWN/MASTERED items
    const [vocabElos, grammarElos] = await Promise.all([
      prisma.userVocabulary.findMany({
        where: {
          userId,
          vocabulary: { languageId, cefrLevel: currentLevel },
          srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] }
        },
        select: { eloRating: true }
      }),
      prisma.userGrammarRule.findMany({
        where: {
          userId,
          grammarRule: { languageId, level: currentLevel },
          srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] }
        },
        select: { eloRating: true }
      })
    ]);

    const allElos = [...vocabElos.map(v => v.eloRating), ...grammarElos.map(g => g.eloRating)];
    const averageElo = allElos.length > 0
      ? allElos.reduce((a, b) => a + b, 0) / allElos.length
      : 0;

    // Check all thresholds
    const isMasteryMet = vocabMastery >= CEFR_CONFIG.MASTERY_THRESHOLD && grammarMastery >= CEFR_CONFIG.MASTERY_THRESHOLD;
    const isEloMet = averageElo >= targetElo;
    const isExposureMet = vocabExposure >= CEFR_CONFIG.MIN_EXPOSURE_PERCENT && grammarExposure >= CEFR_CONFIG.MIN_EXPOSURE_PERCENT;

    if (isMasteryMet && isEloMet && isExposureMet) {
      // Use transaction to ensure atomicity of level-up and audit log
      await prisma.$transaction([
        prisma.userProgress.update({
          where: { id: userProgress.id },
          data: { cefrLevel: nextLevel }
        }),
        prisma.levelUpEvent.create({
          data: {
            userId,
            languageId,
            oldLevel: currentLevel,
            newLevel: nextLevel,
            vocabMastery,
            grammarMastery,
            averageElo
          }
        })
      ]);

      return { oldLevel: currentLevel, newLevel: nextLevel };
    }

    return null;
  }

  static async getCefrProgress(userId: string, languageId: string): Promise<CefrProgressDetail> {
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_languageId: { userId, languageId }
      }
    });

    if (!userProgress) {
      return {
        currentLevel: 'A1',
        nextLevel: 'A2',
        percentComplete: 0,
        vocabMastery: 0,
        grammarMastery: 0,
        vocabExposure: 0,
        grammarExposure: 0,
        averageElo: CEFR_CONFIG.BASE_ELO.A1,
        targetElo: CEFR_CONFIG.ELO_TARGETS.A1
      };
    }

    const currentLevel = userProgress.cefrLevel;
    const currentLevelIndex = CEFR_CONFIG.LEVELS.indexOf(currentLevel);
    const nextLevel = currentLevelIndex < CEFR_CONFIG.LEVELS.length - 1 ? CEFR_CONFIG.LEVELS[currentLevelIndex + 1] : null;

    if (!nextLevel) {
      return {
        currentLevel,
        nextLevel: null,
        percentComplete: 100,
        vocabMastery: 1,
        grammarMastery: 1,
        vocabExposure: 1,
        grammarExposure: 1,
        averageElo: 2000,
        targetElo: null
      };
    }

    const targetElo = CEFR_CONFIG.ELO_TARGETS[currentLevel];

    const [totalVocab, totalGrammar] = await Promise.all([
      prisma.vocabulary.count({ where: { languageId, cefrLevel: currentLevel } }),
      prisma.grammarRule.count({ where: { languageId, level: currentLevel } })
    ]);

    const [masteredVocab, masteredGrammar] = await Promise.all([
      prisma.userVocabulary.count({
        where: {
          userId,
          vocabulary: { languageId, cefrLevel: currentLevel },
          srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] }
        }
      }),
      prisma.userGrammarRule.count({
        where: {
          userId,
          grammarRule: { languageId, level: currentLevel },
          srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] }
        }
      })
    ]);

    const [exposedVocab, exposedGrammar] = await Promise.all([
      prisma.userVocabulary.count({
        where: {
          userId,
          vocabulary: { languageId, cefrLevel: currentLevel },
          srsState: { not: SrsState.UNSEEN }
        }
      }),
      prisma.userGrammarRule.count({
        where: {
          userId,
          grammarRule: { languageId, level: currentLevel },
          srsState: { not: SrsState.UNSEEN }
        }
      })
    ]);

    const vocabMastery = totalVocab > 0 ? masteredVocab / totalVocab : 1.0;
    const grammarMastery = totalGrammar > 0 ? masteredGrammar / totalGrammar : 1.0;
    const vocabExposure = totalVocab > 0 ? exposedVocab / totalVocab : 1.0;
    const grammarExposure = totalGrammar > 0 ? exposedGrammar / totalGrammar : 1.0;

    const [vocabElos, grammarElos] = await Promise.all([
      prisma.userVocabulary.findMany({
        where: {
          userId,
          vocabulary: { languageId, cefrLevel: currentLevel },
          srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] }
        },
        select: { eloRating: true }
      }),
      prisma.userGrammarRule.findMany({
        where: {
          userId,
          grammarRule: { languageId, level: currentLevel },
          srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] }
        },
        select: { eloRating: true }
      })
    ]);

    const allElos = [...vocabElos.map(v => v.eloRating), ...grammarElos.map(g => g.eloRating)];
    const averageElo = allElos.length > 0
      ? allElos.reduce((a, b) => a + b, 0) / allElos.length
      : 1000;

    // Progress = bottleneck of the three requirements (matches evaluateLevelUp logic)
    const masteryProgress = Math.min(vocabMastery, grammarMastery) / CEFR_CONFIG.MASTERY_THRESHOLD;
    const eloProgress = Math.min(1, averageElo / targetElo);
    const exposureProgress = Math.min(vocabExposure, grammarExposure) / CEFR_CONFIG.MIN_EXPOSURE_PERCENT;

    const weightedPercent = Math.min(1,
      (Math.min(1, masteryProgress) * 0.5) +
      (eloProgress * 0.25) +
      (Math.min(1, exposureProgress) * 0.25)
    );

    return {
      currentLevel,
      nextLevel,
      percentComplete: Math.round(weightedPercent * 100),
      vocabMastery: Math.round(vocabMastery * 100) / 100,
      grammarMastery: Math.round(grammarMastery * 100) / 100,
      vocabExposure: Math.round(vocabExposure * 100) / 100,
      grammarExposure: Math.round(grammarExposure * 100) / 100,
      averageElo: Math.round(averageElo),
      targetElo
    };
  }
}
