import type { Pet } from '../../types/Pet';

export default {
    id: 'blaze',
    name: 'Blaze',
    emoji: '1544019907186925608',
    rarity: 'epic',
    description: 'Blaze - Ngọn lửa đến từ địa ngục.',
    baseStats: {
        effective: 0.08,
        xp_multiplier: 0.07,
    },
    combat: true,
    combat_stats: {
        attack: 34,
        health: 110,
        defense: 16,
    },
} satisfies Pet;
