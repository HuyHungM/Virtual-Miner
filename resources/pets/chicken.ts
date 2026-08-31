import type { Pet } from '../../types/Pet';

export default {
    id: 'chicken',
    name: 'Chicken',
    emoji: '1544019312644456489',
    rarity: 'common',
    description: 'Một chú gà nhỏ nhưng rất siêng năng.',
    baseStats: {
        xp_multiplier: 0.02,
        sell_price: 0.02,
    },
} satisfies Pet;
