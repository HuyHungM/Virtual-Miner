import type { Pet } from '../../types/Pet';

export default {
    id: 'zombie',
    name: 'Zombie',
    emoji: '1544019276107747368',
    rarity: 'rare',
    description: 'Zombie kiên trì, không bao giờ bỏ cuộc.',
    baseStats: {
        effective: 0.05,
        sell_price: 0.05,
    },
} satisfies Pet;
