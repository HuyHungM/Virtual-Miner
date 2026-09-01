import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp đá đỏ',
    id: 'redstone_pickaxe',
    biomes: ['ancient_forest'],
    price: 2500000,
    unlock_level: 50,
    description: 'Hồng thạch cộng hưởng, đánh thức nguồn năng lượng cổ xưa.',
    emoji: '1543193249622269982',
    buff: {
        effective: 0.9,
        fortune: 0.6,
        chest_chance: 0.4,
        chest_quality: 0.35,
        xp_multiplier: 0.3,
        sell_price: 0.2,
    },
} satisfies Pickaxe;
