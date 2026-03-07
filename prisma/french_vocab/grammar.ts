export const frenchGrammarRules = [
	{
		id: 'french_gender',
		name: 'Gender of Nouns',
		description:
			"French nouns are either masculine or feminine. Articles and adjectives must agree with the noun's gender.",
		difficulty: 1,
		isEnabled: true,
		dependencies: []
	},
	{
		id: 'french_number',
		name: 'Plural of Nouns',
		description:
			'Most French nouns add an -s to form the plural. Articles and adjectives must agree in number.',
		difficulty: 1,
		isEnabled: true,
		dependencies: ['french_gender']
	},
	{
		id: 'french_present_er',
		name: 'Present Tense (-er verbs)',
		description: 'Conjugation of regular verbs ending in -er in the present tense.',
		difficulty: 1,
		isEnabled: true,
		dependencies: []
	},
	{
		id: 'french_adjective_agreement',
		name: 'Adjective Agreement',
		description:
			'Adjectives must agree in gender and number with the noun they modify, and usually follow the noun.',
		difficulty: 2,
		isEnabled: true,
		dependencies: ['french_gender', 'french_number']
	}
];
