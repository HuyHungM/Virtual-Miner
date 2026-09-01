import type { Pet } from '../../types/Pet';

export default {
    id: 'fox',
    name: 'Fox',
    emoji: '1544019298232574022',
    rarity: 'uncommon',
    description: 'Không gì thoát khỏi sự tinh ranh của nó.',
    baseStats: {
        effective: 0.04,
        xp_multiplier: 0.03,
    },
} satisfies Pet;
