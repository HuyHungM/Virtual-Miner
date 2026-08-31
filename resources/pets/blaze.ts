import type { Pet } from '../../types/Pet';

export default {
    id: 'blaze',
    name: 'Blaze',
    emoji: '1544019907186925608',
    rarity: 'epic',
    description: 'Blaze lửa nóng, thiêu rụi mọi chướng ngại.',
    baseStats: {
        effective: 0.08,
        xp_multiplier: 0.07,
    },
} satisfies Pet;
