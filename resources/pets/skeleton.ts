import type { Pet } from '../../types/Pet';

export default {
    id: 'skeleton',
    name: 'Skeleton',
    emoji: '1544019292063006740',
    rarity: 'rare',
    description: 'Bộ xương linh hoạt, giúp đào được nhiều quặng hơn.',
    baseStats: {
        effective: 0.06,
        xp_multiplier: 0.05,
    },
} satisfies Pet;
