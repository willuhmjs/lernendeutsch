import { prisma } from './prisma';
import { SrsState } from '@prisma/client';

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const ELO_TARGETS: Record<string, number> = {
  'A1': 1150, // To A2
  'A2': 1350, // To B1
  'B1': 1550, // To B2
  'B2': 1750, // To C1
  'C1': 1950  // To C2
};

export interface LevelUpdate {
  oldLevel: string;
  newLevel: string;
}

export class CefrService {
  static async evaluateLevelUp(userId: string, languageId: string): Promise<LevelUpdate | null> {
    // 1. Get current user level from UserProgress
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_languageId: {
          userId,
          languageId
        }
      }
    });

    if (!userProgress) return null;

    const currentLevel = userProgress.cefrLevel;
    const currentLevelIndex = CEFR_LEVELS.indexOf(currentLevel);

    // If at C2 or level not found, no level up possible
    if (currentLevelIndex === -1 || currentLevelIndex === CEFR_LEVELS.length - 1) {
      return null;
    }

    const nextLevel = CEFR_LEVELS[currentLevelIndex + 1];
    const targetElo = ELO_TARGETS[currentLevel];

    // 2. Query Vocabulary items for the current level
    const totalVocabCount = await prisma.vocabulary.count({
      where: {
        languageId,
        cefrLevel: currentLevel
      }
    });

    // 3. Query Grammar items for the current level
    const totalGrammarCount = await prisma.grammarRule.count({
      where: {
        languageId,
        level: currentLevel
      }
    });

    if (totalVocabCount === 0 && totalGrammarCount === 0) {
      // If there's no content for the current level, we might want to allow level up
      // but let's be conservative and say they need to at least have some items mastered if they exist.
      // If none exist, maybe they shouldn't even be at this level, but for now let's just return null
      // to avoid infinite loops or weird states.
      return null;
    }

    // 4. Count user's MASTERED items at current level
    const masteredVocabCount = await prisma.userVocabulary.count({
      where: {
        userId,
        vocabulary: {
          languageId,
          cefrLevel: currentLevel
        },
        srsState: SrsState.MASTERED
      }
    });

    const masteredGrammarCount = await prisma.userGrammarRule.count({
      where: {
        userId,
        grammarRule: {
          languageId,
          level: currentLevel
        },
        srsState: SrsState.MASTERED
      }
    });

    // 5. Calculate mastery percentages
    const vocabMastery = totalVocabCount > 0 ? masteredVocabCount / totalVocabCount : 1.0;
    const grammarMastery = totalGrammarCount > 0 ? masteredGrammarCount / totalGrammarCount : 1.0;

    // 6. Calculate average Elo for current level items (KNOWN or MASTERED)
    const vocabElos = await prisma.userVocabulary.findMany({
      where: {
        userId,
        vocabulary: {
          languageId,
          cefrLevel: currentLevel
        },
        srsState: {
          in: [SrsState.KNOWN, SrsState.MASTERED]
        }
      },
      select: { eloRating: true }
    });

    const grammarElos = await prisma.userGrammarRule.findMany({
      where: {
        userId,
        grammarRule: {
          languageId,
          level: currentLevel
        },
        srsState: {
          in: [SrsState.KNOWN, SrsState.MASTERED]
        }
      },
      select: { eloRating: true }
    });

    const allElos = [...vocabElos.map(v => v.eloRating), ...grammarElos.map(g => g.eloRating)];
    const averageElo = allElos.length > 0 
      ? allElos.reduce((a, b) => a + b, 0) / allElos.length 
      : 0;

    // 7. Check thresholds
    const masteryThreshold = 0.8;
    const isMasteryMet = vocabMastery >= masteryThreshold && grammarMastery >= masteryThreshold;
    const isEloMet = averageElo >= targetElo;

    if (isMasteryMet && isEloMet) {
      // Perform level up
      await prisma.userProgress.update({
        where: {
          id: userProgress.id
        },
        data: {
          cefrLevel: nextLevel
        }
      });

      return {
        oldLevel: currentLevel,
        newLevel: nextLevel
      };
    }

    return null;
  }

  static async getCefrProgress(userId: string, languageId: string): Promise<{ currentLevel: string, nextLevel: string | null, percentComplete: number }> {
    const userProgress = await prisma.userProgress.findUnique({
      where: {
        userId_languageId: {
          userId,
          languageId
        }
      }
    });

    if (!userProgress) {
      return { currentLevel: 'A1', nextLevel: 'A2', percentComplete: 0 };
    }

    const currentLevel = userProgress.cefrLevel;
    const currentLevelIndex = CEFR_LEVELS.indexOf(currentLevel);
    const nextLevel = currentLevelIndex < CEFR_LEVELS.length - 1 ? CEFR_LEVELS[currentLevelIndex + 1] : null;

    if (!nextLevel) {
      return { currentLevel, nextLevel: null, percentComplete: 100 };
    }

    const targetElo = ELO_TARGETS[currentLevel];

    // Total items at current level
    const [totalVocab, totalGrammar] = await Promise.all([
      prisma.vocabulary.count({ where: { languageId, cefrLevel: currentLevel } }),
      prisma.grammarRule.count({ where: { languageId, level: currentLevel } })
    ]);

    const totalItems = totalVocab + totalGrammar;

    // Mastered items at current level
    const [masteredVocab, masteredGrammar] = await Promise.all([
      prisma.userVocabulary.count({
        where: {
          userId,
          vocabulary: { languageId, cefrLevel: currentLevel },
          srsState: SrsState.MASTERED
        }
      }),
      prisma.userGrammarRule.count({
        where: {
          userId,
          grammarRule: { languageId, level: currentLevel },
          srsState: SrsState.MASTERED
        }
      })
    ]);

    const masteredItems = masteredVocab + masteredGrammar;
    const masteryPercent = totalItems > 0 ? masteredItems / totalItems : 1.0;

    // Average Elo for current level
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
      : 1000; // Default to 1000 if no items

    const eloProximity = Math.min(1, averageElo / targetElo);

    const weightedPercent = (masteryPercent * 0.8) + (eloProximity * 0.2);

    return {
      currentLevel,
      nextLevel,
      percentComplete: Math.round(weightedPercent * 100)
    };
  }
}
