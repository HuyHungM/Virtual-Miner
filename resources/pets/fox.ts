import type { Pet } from '../../types/Pet';

export default {
    id: 'fox',
    name: 'Fox',
    emoji: '1544019298232574022',
    rarity: 'uncommon',
    description: 'Cáo nhanh nhẹn, giúp bạn đào nhanh hơn.',
    baseStats: {
        effective: 0.04,
        xp_multiplier: 0.03,
    },
} satisfies Pet;
