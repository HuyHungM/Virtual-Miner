import type { Pet } from '../../types/Pet';

export default {
    id: 'wolf',
    name: 'Wolf',
    emoji: '1544019278129405952',
    rarity: 'uncommon',
    description: 'Bản năng hoang dã, trái tim trung thành.',
    baseStats: {
        effective: 0.04,
        fortune: 0.03,
    },
    combat: true,
    combat_stats: {
        attack: 20,
        health: 80,
        defense: 10,
    },
} satisfies Pet;
