import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp Vàng',
    id: 'golden_pickaxe',
    biomes: ['ancient_forest'],
    price: 250000,
    unlock_level: 50,
    description: 'Hoàng kim phủ sắc cổ lâm, đánh thức những gì bị lãng quên.',
    emoji: '1543192468839997511',
    buff: {
        effective: 0.7,
        fortune: 0.45,
        chest_chance: 0.3,
        chest_quality: 0.3,
        xp_multiplier: 0.2,
        sell_price: 0.1,
    },
} satisfies Pickaxe;
