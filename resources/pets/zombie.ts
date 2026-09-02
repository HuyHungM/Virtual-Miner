import type { Pet } from '../../types/Pet';

export default {
    id: 'zombie',
    name: 'Thây ma',
    emoji: '1544019276107747368',
    rarity: 'rare',
    description: 'Zombie - Bóng hình mục rữa giữa màn đêm.',
    baseStats: {
        effective: 0.05,
        sell_price: 0.05,
    },
} satisfies Pet;
