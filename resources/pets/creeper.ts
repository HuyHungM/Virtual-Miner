import type { Pet } from '../../types/Pet';

export default {
    id: 'creeper',
    name: 'Creeper',
    emoji: '1544019308630380594',
    rarity: 'epic',
    description: 'Creeper - Kẻ gieo rắc hỗn loạn.',
    baseStats: {
        chest_chance: 0.06,
        chest_quality: 0.05,
        fortune: 0.04,
    },
} satisfies Pet;
