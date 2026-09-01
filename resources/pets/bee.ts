import type { Pet } from '../../types/Pet';

export default {
    id: 'bee',
    name: 'Bee',
    emoji: '1544019322446413995',
    rarity: 'uncommon',
    description: 'Nhỏ bé nhưng đầy sức mạnh.',
    baseStats: {
        sell_price: 0.04,
        xp_multiplier: 0.03,
    },
} satisfies Pet;
