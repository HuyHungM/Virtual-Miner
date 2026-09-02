import type { Pet } from '../../types/Pet';

export default {
    id: 'chicken',
    name: 'Gà',
    emoji: '1544019312644456489',
    rarity: 'common',
    description: 'Đừng đánh giá thấp một chú gà.',
    baseStats: {
        xp_multiplier: 0.02,
        sell_price: 0.02,
    },
} satisfies Pet;
