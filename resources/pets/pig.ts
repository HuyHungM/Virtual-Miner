import type { Pet } from '../../types/Pet';

export default {
    id: 'pig',
    name: 'Pig',
    emoji: '1544019296051666997',
    rarity: 'common',
    description: 'Heo con dễ thương, thích tìm kiếm kho báu.',
    baseStats: {
        chest_chance: 0.02,
        fortune: 0.02,
    },
} satisfies Pet;
