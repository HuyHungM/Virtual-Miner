import type { Pet } from '../../types/Pet';

export default {
    id: 'cat',
    name: 'Cat',
    emoji: '1544019315689390090',
    rarity: 'uncommon',
    description: 'Mèo tinh nghịch may mắn, thích rương kho báu.',
    baseStats: {
        chest_chance: 0.03,
        fortune: 0.04,
    },
} satisfies Pet;
