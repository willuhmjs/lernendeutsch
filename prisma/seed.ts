import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

import { verbs as deVerbs } from './german_vocab/verbs';
import { nouns as deNouns } from './german_vocab/nouns';
import { adverbs as deAdverbs } from './german_vocab/adverbs';
import { adjectives as deAdjectives } from './german_vocab/adjectives';
import { conjunctions as deConjunctions } from './german_vocab/conjunctions';
import { prepositions as dePrepositions } from './german_vocab/prepositions';
import { pronouns as dePronouns } from './german_vocab/pronouns';
import { particles as deParticles } from './german_vocab/particles';
import { interjections as deInterjections } from './german_vocab/interjections';
import { articles as deArticles } from './german_vocab/articles';

import { verbs as esVerbs } from './spanish_vocab/verbs';
import { nouns as esNouns } from './spanish_vocab/nouns';
import { adverbs as esAdverbs } from './spanish_vocab/adverbs';
import { adjectives as esAdjectives } from './spanish_vocab/adjectives';
import { conjunctions as esConjunctions } from './spanish_vocab/conjunctions';
import { prepositions as esPrepositions } from './spanish_vocab/prepositions';
import { pronouns as esPronouns } from './spanish_vocab/pronouns';
import { particles as esParticles } from './spanish_vocab/particles';
import { interjections as esInterjections } from './spanish_vocab/interjections';
import { articles as esArticles } from './spanish_vocab/articles';


const germanVocabulary = [
  ...deArticles,
	...deVerbs,
	...deNouns,
	...deAdverbs,
	...deAdjectives,
	...deConjunctions,
	...dePrepositions,
	...dePronouns,
	...deParticles,
	...deInterjections
];

const spanishVocabulary = [
  ...esArticles,
	...esVerbs,
	...esNouns,
	...esAdverbs,
	...esAdjectives,
	...esConjunctions,
	...esPrepositions,
	...esPronouns,
	...esParticles,
	...esInterjections
];

const basicGrammarRules = [
  // ===== A1 Rules =====
  {
    title: 'Personal Pronouns (Nominative)',
    description: 'The use of ich, du, er, sie, es, wir, ihr, sie, Sie as subjects.',
    level: 'A1',
    dependencies: []
  },
  {
    title: 'Present Tense (Präsens) - Regular Verbs',
    description: 'Conjugation of regular verbs in the present tense (e.g., ich mache, du machst, er/sie/es macht).',
    level: 'A1',
    dependencies: ['Personal Pronouns (Nominative)']
  },
  {
    title: 'Present Tense (Präsens) - Irregular Verbs',
    description: 'Common irregular verbs with stem-vowel changes in du/er forms (e.g., fahren → fährst, sprechen → sprichst, sehen → siehst).',
    level: 'A1',
    dependencies: ['Present Tense (Präsens) - Regular Verbs']
  },
  {
    title: 'Sein, Haben, Werden - Conjugation',
    description: 'The three most important irregular verbs "sein" (to be), "haben" (to have), and "werden" (to become) and their present-tense forms.',
    level: 'A1',
    dependencies: ['Personal Pronouns (Nominative)']
  },
  {
    title: 'Noun Gender (Genus)',
    description: 'Every German noun has a grammatical gender: masculine (der), feminine (die), or neuter (das). Gender must be memorized with each noun.',
    level: 'A1',
    dependencies: []
  },
  {
    title: 'Definite Articles (Nominative)',
    description: 'The use of der, die, das in the nominative case.',
    level: 'A1',
    dependencies: ['Noun Gender (Genus)']
  },
  {
    title: 'Indefinite Articles (Nominative)',
    description: 'The use of ein, eine, ein in the nominative case.',
    level: 'A1',
    dependencies: ['Definite Articles (Nominative)']
  },
  {
    title: 'Plural Nouns (Pluralbildung)',
    description: 'German nouns form plurals in various ways: -e, -er, -en, -n, -s, umlaut changes, or no change. All plurals use "die" as their article.',
    level: 'A1',
    dependencies: ['Noun Gender (Genus)']
  },
  {
    title: 'Word Order - Main Clause (Hauptsatz)',
    description: 'The verb is always the second element in a standard declarative main clause (V2 word order).',
    level: 'A1',
    dependencies: ['Present Tense (Präsens) - Regular Verbs']
  },
  {
    title: 'Accusative Case (Akkusativ)',
    description: 'Direct objects. Note: only masculine articles change (der -> den, ein -> einen).',
    level: 'A1',
    dependencies: ['Definite Articles (Nominative)', 'Indefinite Articles (Nominative)', 'Word Order - Main Clause (Hauptsatz)']
  },
  {
    title: 'Negation with "nicht" and "kein"',
    description: '"Nicht" negates verbs, adjectives, and specific nouns; "kein" negates indefinite nouns (ein → kein). Placement rules differ.',
    level: 'A1',
    dependencies: ['Accusative Case (Akkusativ)']
  },
  {
    title: 'Yes/No Questions (Entscheidungsfragen)',
    description: 'Questions answered with ja/nein are formed by placing the conjugated verb in first position (e.g., Sprichst du Deutsch?).',
    level: 'A1',
    dependencies: ['Word Order - Main Clause (Hauptsatz)']
  },
  {
    title: 'W-Questions (W-Fragen)',
    description: 'Questions starting with a W-word (wer, was, wo, wann, warum, wie, etc.) with the verb in second position.',
    level: 'A1',
    dependencies: ['Yes/No Questions (Entscheidungsfragen)']
  },
  {
    title: 'Possessive Articles (Possessivartikel)',
    description: 'Words showing ownership: mein (my), dein (your), sein (his/its), ihr (her/their), unser (our), euer (your pl.), Ihr (formal your). Declined like "ein".',
    level: 'A1',
    dependencies: ['Indefinite Articles (Nominative)', 'Personal Pronouns (Nominative)']
  },
  {
    title: 'Modal Verbs (Modalverben)',
    description: 'Verbs expressing ability, obligation, permission, etc.: können, müssen, dürfen, sollen, wollen, mögen/möchten. The main verb goes to the end in infinitive form.',
    level: 'A1',
    dependencies: ['Present Tense (Präsens) - Irregular Verbs', 'Word Order - Main Clause (Hauptsatz)']
  },
  {
    title: 'Separable Verbs (Trennbare Verben)',
    description: 'Verbs with a separable prefix (e.g., anfangen, aufstehen, einkaufen). In main clauses, the prefix moves to the end of the sentence.',
    level: 'A1',
    dependencies: ['Present Tense (Präsens) - Regular Verbs', 'Word Order - Main Clause (Hauptsatz)']
  },
  {
    title: 'Inseparable Verbs (Untrennbare Verben)',
    description: 'Verbs with prefixes that never separate: be-, emp-, ent-, er-, ge-, miss-, ver-, zer- (e.g., verstehen, beginnen, empfehlen).',
    level: 'A1',
    dependencies: ['Separable Verbs (Trennbare Verben)']
  },
  {
    title: 'Accusative Prepositions',
    description: 'Prepositions that always take the accusative case: durch, für, gegen, ohne, um, bis, entlang.',
    level: 'A1',
    dependencies: ['Accusative Case (Akkusativ)']
  },
  {
    title: 'Numbers and Time Expressions',
    description: 'Cardinal numbers, ordinal numbers, telling time (Es ist drei Uhr / halb vier), days of the week, months.',
    level: 'A1',
    dependencies: []
  },
  {
    title: 'Imperative (Imperativ)',
    description: 'Giving commands or instructions in du, ihr, and Sie forms (e.g., Komm!, Kommt!, Kommen Sie!).',
    level: 'A1',
    dependencies: ['Present Tense (Präsens) - Regular Verbs']
  },
  {
    title: 'Coordinating Conjunctions (Konjunktionen)',
    description: 'Conjunctions that do not change word order: und (and), aber (but), oder (or), denn (because), sondern (but rather).',
    level: 'A1',
    dependencies: ['Word Order - Main Clause (Hauptsatz)']
  },

  // ===== A2 Rules =====
  {
    title: 'Perfect Tense (Perfekt)',
    description: 'Used for spoken past tense. Formed with "haben" or "sein" and the past participle.',
    level: 'A2',
    dependencies: ['Sein, Haben, Werden - Conjugation', 'Separable Verbs (Trennbare Verben)', 'Inseparable Verbs (Untrennbare Verben)']
  },
  {
    title: 'Dative Case (Dativ)',
    description: 'Indirect objects. Articles change: der/das -> dem, die -> der, plural -> den + n.',
    level: 'A2',
    dependencies: ['Accusative Case (Akkusativ)']
  },
  {
    title: 'Dative Prepositions',
    description: 'Prepositions that always take the dative case (aus, außer, bei, mit, nach, seit, von, zu).',
    level: 'A2',
    dependencies: ['Dative Case (Dativ)']
  },
  {
    title: 'Reflexive Verbs',
    description: 'Verbs that require a reflexive pronoun (mich, dich, sich, uns, euch, sich).',
    level: 'A2',
    dependencies: ['Accusative Case (Akkusativ)']
  },
  {
    title: 'Two-Way Prepositions (Wechselpräpositionen)',
    description: 'Prepositions (in, an, auf, über, unter, vor, hinter, neben, zwischen) that take Accusative for movement/direction and Dative for static location.',
    level: 'A2',
    dependencies: ['Accusative Prepositions', 'Dative Prepositions']
  },
  {
    title: 'Adjective Endings (Adjektivdeklination)',
    description: 'The endings added to adjectives based on the gender, case, and type of article (definite, indefinite, or none).',
    level: 'A2',
    dependencies: ['Dative Case (Dativ)']
  },
  {
    title: 'Comparative and Superlative (Komparativ und Superlativ)',
    description: 'Comparing things: Komparativ adds "-er" (schneller), Superlativ uses "am + -sten" (am schnellsten) or "der/die/das + -ste". Many common adjectives add an umlaut (alt → älter).',
    level: 'A2',
    dependencies: ['Adjective Endings (Adjektivdeklination)']
  },
  {
    title: 'Personal Pronouns in Accusative and Dative',
    description: 'Pronoun forms change by case: ich → mich/mir, du → dich/dir, er → ihn/ihm, sie → sie/ihr, es → es/ihm, etc.',
    level: 'A2',
    dependencies: ['Dative Case (Dativ)', 'Personal Pronouns (Nominative)']
  },
  {
    title: 'Subordinating Conjunctions (Subjunktionen)',
    description: 'Conjunctions that send the verb to the end: weil (dass), wenn, ob, als, obwohl, damit.',
    level: 'A2',
    dependencies: ['Coordinating Conjunctions (Konjunktionen)']
  },
  {
    title: 'Temporal Prepositions (Temporale Präpositionen)',
    description: 'Prepositions for time expressions: am, im, um, von...bis, seit, vor.',
    level: 'A2',
    dependencies: ['Dative Prepositions', 'Numbers and Time Expressions']
  },
  {
    title: 'Verbs with Dative Objects',
    description: 'Certain verbs that require a dative object instead of accusative: helfen, gefallen, gehören, etc.',
    level: 'A2',
    dependencies: ['Dative Case (Dativ)']
  },
  {
    title: 'Word Order with Two Objects',
    description: 'When a sentence has both dative and accusative objects.',
    level: 'A2',
    dependencies: ['Verbs with Dative Objects']
  },
  {
    title: 'Adverbs of Frequency and Time',
    description: 'Common time adverbs and their placement: immer, oft, manchmal, selten, nie, schon, noch, gerade, bald.',
    level: 'A2',
    dependencies: ['Word Order - Main Clause (Hauptsatz)']
  },
  {
    title: '"es gibt" Construction',
    description: '"Es gibt" + Accusative is used to express existence or availability (There is/are). E.g., Es gibt einen Park hier.',
    level: 'A2',
    dependencies: ['Accusative Case (Akkusativ)']
  },

  // ===== B1 Rules =====
  {
    title: 'Simple Past (Präteritum)',
    description: 'Used primarily in written past tense for storytelling and formal reports.',
    level: 'B1',
    dependencies: ['Perfect Tense (Perfekt)']
  },
  {
    title: 'Subordinate Clauses (Nebensätze)',
    description: 'Clauses introduced by conjunctions like "dass", "weil", "wenn", where the conjugated verb moves to the end.',
    level: 'B1',
    dependencies: ['Subordinating Conjunctions (Subjunktionen)']
  },
  {
    title: 'Passive Voice (Passiv) - Present',
    description: 'Focuses on the action rather than the doer. Formed with "werden" + past participle.',
    level: 'B1',
    dependencies: ['Sein, Haben, Werden - Conjugation', 'Perfect Tense (Perfekt)']
  },
  {
    title: 'Relative Clauses (Relativsätze)',
    description: 'Clauses used to provide more info about a noun, using relative pronouns (der, die, das) with the verb at the end.',
    level: 'B1',
    dependencies: ['Subordinate Clauses (Nebensätze)', 'Personal Pronouns in Accusative and Dative']
  },
  {
    title: 'Genitive Case (Genitiv)',
    description: 'Used to show possession or after certain prepositions (wegen, während). Often replaced by "von + Dativ" in spoken German.',
    level: 'B1',
    dependencies: ['Dative Case (Dativ)']
  },
  {
    title: 'Future I (Futur I)',
    description: 'Used for intentions and predictions. Formed with "werden" + infinitive.',
    level: 'B1',
    dependencies: ['Sein, Haben, Werden - Conjugation']
  },
  {
    title: 'Infinitive Clauses with "zu" (Infinitivsätze)',
    description: 'Clauses using "zu" + infinitive, often after verbs like versuchen, anfangen, aufhören, or with "um...zu" (in order to), "ohne...zu" (without), "anstatt...zu" (instead of).',
    level: 'B1',
    dependencies: ['Subordinate Clauses (Nebensätze)']
  },
  {
    title: 'Indirect Questions (Indirekte Fragen)',
    description: 'Questions embedded in a sentence using "ob" (whether) or a W-word, with the verb at the end: Ich weiß nicht, ob er kommt.',
    level: 'B1',
    dependencies: ['W-Questions (W-Fragen)', 'Subordinate Clauses (Nebensätze)']
  },
  {
    title: 'Conjunctive Adverbs (Konjunktionaladverbien)',
    description: 'Adverbs that connect clauses and cause verb-subject inversion: deshalb, trotzdem, deswegen, außerdem, stattdessen, dennoch.',
    level: 'B1',
    dependencies: ['Coordinating Conjunctions (Konjunktionen)']
  },
  {
    title: 'Passive Voice - Past Tenses (Passiv Perfekt/Präteritum)',
    description: 'Passive in Perfekt: "sein" + past participle + "worden" (Es ist gebaut worden). Passive in Präteritum: "wurde" + past participle.',
    level: 'B1',
    dependencies: ['Passive Voice (Passiv) - Present', 'Simple Past (Präteritum)']
  },
  {
    title: 'Verbs with Prepositional Objects (Verben mit Präpositionalobjekt)',
    description: 'Verbs requiring a specific preposition: warten auf, sich freuen über/auf, denken an, sich interessieren für, Angst haben vor, etc.',
    level: 'B1',
    dependencies: ['Accusative Prepositions', 'Dative Prepositions']
  },
  {
    title: 'Da-Compounds (Da-Komposita)',
    description: 'Replacing "preposition + pronoun" for things (not people) with da(r)- + preposition: darauf, damit, darüber, dafür, daran, etc.',
    level: 'B1',
    dependencies: ['Verbs with Prepositional Objects (Verben mit Präpositionalobjekt)']
  },
  {
    title: 'Wo-Compounds (Wo-Komposita)',
    description: 'Question words for prepositional objects referring to things: worauf, womit, worüber, wofür, woran, etc.',
    level: 'B1',
    dependencies: ['Da-Compounds (Da-Komposita)']
  },
  {
    title: 'Konjunktiv II - Common Forms',
    description: 'Basic subjunctive for politeness and wishes: hätte, wäre, könnte, würde + infinitive. "Ich hätte gern..." / "Könnten Sie...?"',
    level: 'B1',
    dependencies: ['Simple Past (Präteritum)']
  },
  {
    title: '"lassen" (to let / to have something done)',
    description: 'Used with an infinitive to mean "to let/allow" (Lass mich gehen) or "to have something done" (Ich lasse mein Auto reparieren).',
    level: 'B1',
    dependencies: ['Modal Verbs (Modalverben)']
  },
  {
    title: 'Genitive Prepositions',
    description: 'Prepositions that take the genitive case: wegen, während, trotz, (an)statt, innerhalb, außerhalb, aufgrund.',
    level: 'B1',
    dependencies: ['Genitive Case (Genitiv)']
  },

  // ===== B2 Rules =====
  {
    title: 'Plusquamperfekt (Past Perfect)',
    description: 'Used to describe an action that happened before another past action. Formed with Präteritum of "haben/sein" + past participle.',
    level: 'B2',
    dependencies: ['Simple Past (Präteritum)', 'Perfect Tense (Perfekt)']
  },
  {
    title: 'Konjunktiv II (Subjunctive II) - Present',
    description: 'Used for unreal situations, wishes, and polite requests. Often formed with "würde" + infinitive.',
    level: 'B2',
    dependencies: ['Konjunktiv II - Common Forms']
  },
  {
    title: 'Konjunktiv II (Subjunctive II) - Past',
    description: 'Expresses unreal conditions in the past: "hätte/wäre" + past participle. E.g., Wenn ich das gewusst hätte, wäre ich gekommen.',
    level: 'B2',
    dependencies: ['Konjunktiv II (Subjunctive II) - Present', 'Plusquamperfekt (Past Perfect)']
  },
  {
    title: 'N-Declension (N-Deklination)',
    description: 'Specific masculine nouns that take an "-n" or "-en" ending in all cases except Nominative singular.',
    level: 'B2',
    dependencies: ['Accusative Case (Akkusativ)', 'Dative Case (Dativ)']
  },
  {
    title: 'Modal Particles (Modalpartikeln)',
    description: 'Small words (doch, ja, mal, halt, eben, schon, wohl) that convey emotion or emphasis but have no direct translation.',
    level: 'B2',
    dependencies: ['Adverbs of Frequency and Time']
  },
  {
    title: 'Future II (Futur II)',
    description: 'Expresses a completed action in the future or a past assumption. Formed with "werden" + past participle + "haben/sein". E.g., Er wird das Buch gelesen haben.',
    level: 'B2',
    dependencies: ['Future I (Futur I)', 'Perfect Tense (Perfekt)']
  },
  {
    title: 'Passive with Modal Verbs',
    description: 'Combining passive voice with modal verbs: modal + past participle + "werden". E.g., Das muss sofort erledigt werden (That must be taken care of immediately).',
    level: 'B2',
    dependencies: ['Passive Voice (Passiv) - Present', 'Modal Verbs (Modalverben)']
  },
  {
    title: 'Subjective Meaning of Modal Verbs',
    description: 'Modal verbs used to express assumptions or probability: Er muss krank sein (He must be sick). Sie soll reich sein (She is said to be rich).',
    level: 'B2',
    dependencies: ['Modal Verbs (Modalverben)']
  },
  {
    title: '"je...desto/umso" Comparisons',
    description: 'Proportional comparison: "Je" + comparative + subordinate clause, "desto/umso" + comparative + main clause. E.g., Je mehr ich lerne, desto besser werde ich.',
    level: 'B2',
    dependencies: ['Comparative and Superlative (Komparativ und Superlativ)', 'Subordinate Clauses (Nebensätze)']
  },
  {
    title: 'Double Connectors (Doppelkonjunktionen)',
    description: 'Two-part connectors: sowohl...als auch, weder...noch, entweder...oder, nicht nur...sondern auch, zwar...aber.',
    level: 'B2',
    dependencies: ['Coordinating Conjunctions (Konjunktionen)']
  },
  {
    title: 'Extended Relative Clauses',
    description: 'Relative clauses with "was" (after indefinite pronouns/superlatives), "wo" (for places), and "wer" (whoever).',
    level: 'B2',
    dependencies: ['Relative Clauses (Relativsätze)']
  },
  {
    title: 'Statal Passive (Zustandspassiv)',
    description: 'Describes a state resulting from a completed action, formed with "sein" + past participle: Die Tür ist geöffnet.',
    level: 'B2',
    dependencies: ['Passive Voice (Passiv) - Present']
  },
  {
    title: 'Verb-Noun Combinations (Nomen-Verb-Verbindungen)',
    description: 'Fixed expressions where a noun and verb form a set phrase: eine Entscheidung treffen, in Betracht ziehen.',
    level: 'B2',
    dependencies: ['Verbs with Prepositional Objects (Verben mit Präpositionalobjekt)']
  },

  // ===== C1 Rules =====
  {
    title: 'Konjunktiv I (Subjunctive I)',
    description: 'Used primarily in indirect speech (indirekte Rede), especially in journalism and formal writing.',
    level: 'C1',
    dependencies: ['Konjunktiv II (Subjunctive II) - Present']
  },
  {
    title: 'Partizipialattribute (Participial Attributes)',
    description: 'Extended adjective phrases built from present or past participles, placed before the noun.',
    level: 'C1',
    dependencies: ['Relative Clauses (Relativsätze)', 'Adjective Endings (Adjektivdeklination)']
  },
  {
    title: 'Nominalization (Nominalisierung)',
    description: 'Transforming verbs or adjectives into nouns, often used in scientific or formal language.',
    level: 'C1',
    dependencies: ['Genitive Case (Genitiv)', 'Noun Gender (Genus)']
  },
  {
    title: 'Functional Verb Structures (Funktionsverbgefüge)',
    description: 'Fixed verb-noun combinations where the verb has a reduced meaning.',
    level: 'C1',
    dependencies: ['Verb-Noun Combinations (Nomen-Verb-Verbindungen)']
  },
  {
    title: 'Complex Sentence Connectors',
    description: 'Advanced connectors for formal writing: indem, sofern, insofern als, es sei denn, geschweige denn.',
    level: 'C1',
    dependencies: ['Subordinate Clauses (Nebensätze)']
  },
  {
    title: 'Passive Alternatives (Passiversatzformen)',
    description: 'Structures that replace passive: "sich lassen" + infinitive, "sein + zu + Infinitiv", "-bar" adjectives.',
    level: 'C1',
    dependencies: ['Passive Voice (Passiv) - Present']
  },
  {
    title: 'Subjective Modal Verbs in Past',
    description: 'Modal verbs expressing past assumptions: Er muss krank gewesen sein.',
    level: 'C1',
    dependencies: ['Subjective Meaning of Modal Verbs', 'Plusquamperfekt (Past Perfect)']
  },
  {
    title: 'Concessive Clauses and Structures',
    description: 'Expressing concession beyond "obwohl": wenn...auch, so...auch, wie...auch immer.',
    level: 'C1',
    dependencies: ['Subordinate Clauses (Nebensätze)']
  },
  {
    title: 'Appositional Constructions (Appositionen)',
    description: 'Parenthetical explanations inserted into sentences. The apposition matches the case of the noun it modifies.',
    level: 'C1',
    dependencies: ['Relative Clauses (Relativsätze)']
  },
  {
    title: 'Expanded Prepositional Phrases',
    description: 'Complex prepositional expressions used in formal/academic language.',
    level: 'C1',
    dependencies: ['Genitive Prepositions', 'Dative Prepositions']
  },

  // ===== C2 Rules =====
  {
    title: 'Konjunktiv I - Past (Vergangenheit)',
    description: 'Past forms of Konjunktiv I for indirect speech: Er sagte, er habe das Buch gelesen.',
    level: 'C2',
    dependencies: ['Konjunktiv I (Subjunctive I)']
  },
  {
    title: 'Archaic and Literary Konjunktiv II Forms',
    description: 'Using original Konjunktiv II forms instead of "würde" + infinitive in literary contexts.',
    level: 'C2',
    dependencies: ['Konjunktiv II (Subjunctive II) - Present']
  },
  {
    title: 'Complex Participial Constructions',
    description: 'Heavily nested participial attributes common in academic/legal writing.',
    level: 'C2',
    dependencies: ['Partizipialattribute (Participial Attributes)']
  },
  {
    title: 'Rhetorical and Stylistic Devices',
    description: 'Advanced rhetorical structures: inversion for emphasis, deliberate word-order variation.',
    level: 'C2',
    dependencies: ['Complex Sentence Connectors']
  },
  {
    title: 'Register and Style Variation',
    description: 'Mastering transitions between registers: colloquial, standard, formal/written, and academic.',
    level: 'C2',
    dependencies: ['Rhetorical and Stylistic Devices']
  },
  {
    title: 'Idiomatic Expressions (Redewendungen)',
    description: 'Fixed idiomatic phrases whose meaning cannot be derived from individual words.',
    level: 'C2',
    dependencies: []
  }
];

export async function runSeed(client: PrismaClient = prisma, override: boolean = false) {
  // 1. Check if we need to seed
  const count = await client.vocabulary.count();
  if (count > 0 && !override) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  console.log('Start seeding...');

  // 1.5 Create Languages
  console.log('Creating languages...');
  const german = await client.language.upsert({
    where: { code: 'de' },
    update: {},
    create: { code: 'de', name: 'German', flag: '🇩🇪' },
  });

  const spanish = await client.language.upsert({
    where: { code: 'es' },
    update: {},
    create: { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  });

  // 2. Insert Vocabulary
  console.log('Seeding vocabulary...');
  for (const vocab of germanVocabulary) {
    let gender: any = (vocab as any).gender;
    if (gender === 'der') gender = 'MASCULINE';
    else if (gender === 'die') gender = 'FEMININE';
    else if (gender === 'das') gender = 'NEUTER';

    await client.vocabulary.create({
      data: {
        ...vocab,
        gender,
        languageId: german.id
      },
    });
  }
  console.log(`Seeded ${germanVocabulary.length} vocabulary words for German.`);

  console.log('Seeding Spanish vocabulary...');
  for (const vocab of spanishVocabulary) {
    let gender: any = (vocab as any).gender;

    await client.vocabulary.create({
      data: {
        ...vocab,
        gender,
        languageId: spanish.id
      },
    });
  }
  console.log(`Seeded ${spanishVocabulary.length} vocabulary words for Spanish.`);

  // 3. Insert Grammar Rules (First Pass: Create without dependencies)
  console.log('Seeding grammar rules (First Pass)...');
  for (const rule of basicGrammarRules) {
    await client.grammarRule.create({
      data: {
        title: rule.title,
        description: rule.description,
        level: rule.level,
        languageId: german.id
      },
    });
  }

  console.log(`Seeded ${basicGrammarRules.length} grammar rules.`);

  // 4. Update Grammar Rules (Second Pass: Connect dependencies)
  console.log('Connecting grammar rule dependencies (Second Pass)...');
  for (const rule of basicGrammarRules) {
    if (rule.dependencies && rule.dependencies.length > 0) {
      const parentRules = await client.grammarRule.findMany({
        where: { title: { in: rule.dependencies } },
      });
      
      const currentRule = await client.grammarRule.findFirst({
        where: { title: rule.title }
      });

      if (parentRules.length > 0 && currentRule) {
        await client.grammarRule.update({
          where: { id: currentRule.id },
          data: {
            dependencies: {
              connect: parentRules.map((parent) => ({ id: parent.id })),
            },
          },
        });
      }
    }
  }
  console.log('Connected grammar rule dependencies.');

  console.log('Seeding finished.');
}

async function main() {
  await runSeed(prisma, true);
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1] === __filename) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
