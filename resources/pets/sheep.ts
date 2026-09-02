import type { Pet } from '../../types/Pet';

export default {
    id: 'sheep',
    name: 'Cừu',
    emoji: '1544019294357028954',
    rarity: 'common',
    description: 'Kiên nhẫn vượt qua mọi chặng đường.',
    baseStats: {
        effective: 0.02,
        xp_multiplier: 0.02,
    },
} satisfies Pet;
