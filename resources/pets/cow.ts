import type { Pet } from '../../types/Pet';

export default {
    id: 'cow',
    name: 'Cow',
    emoji: '1544019310656233532',
    rarity: 'common',
    description: 'Bò sữa trung thành, luôn bên bạn mỗi ngày.',
    baseStats: {
        fortune: 0.02,
        sell_price: 0.02,
    },
} satisfies Pet;
