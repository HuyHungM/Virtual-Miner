import type { Pet } from '../../types/Pet';

export default {
    id: 'sheep',
    name: 'Sheep',
    emoji: '1544019294357028954',
    rarity: 'common',
    description: 'Cừu wooly giúp bạn đào thêm quặng.',
    baseStats: {
        effective: 0.02,
        xp_multiplier: 0.02,
    },
} satisfies Pet;
