import type { Pet } from '../../types/Pet';

export default {
    id: 'cow',
    name: 'Bò',
    emoji: '1544019310656233532',
    rarity: 'common',
    description: 'Sức mạnh đến từ sự kiên nhẫn.',
    baseStats: {
        fortune: 0.02,
        sell_price: 0.02,
    },
} satisfies Pet;
