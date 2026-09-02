import type { Pet } from '../../types/Pet';

export default {
    id: 'cat',
    name: 'Mèo',
    emoji: '1544019315689390090',
    rarity: 'uncommon',
    description: 'Nhỏ nhắn, nhanh nhẹn và bí ẩn.',
    baseStats: {
        chest_chance: 0.03,
        fortune: 0.04,
    },
} satisfies Pet;
