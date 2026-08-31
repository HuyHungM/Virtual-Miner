import type { Pet } from '../../types/Pet';

export default {
    id: 'enderman',
    name: 'Enderman',
    emoji: '1544019306352869406',
    rarity: 'epic',
    description: 'Enderman teleport, tìm kho báu ở mọi nơi.',
    baseStats: {
        fortune: 0.08,
        chest_quality: 0.06,
        sell_price: 0.05,
    },
} satisfies Pet;
