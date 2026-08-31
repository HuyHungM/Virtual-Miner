import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp hoàng ngọc',
    id: 'topaz_pickaxe',
    biomes: ['ancient_forest'],
    price: 6000000,
    unlock_level: 50,
    description: 'Ánh cam rực rỡ, sức mạnh đáng gờm.',
    emoji: '1543198570545680434',
    buff: {
        effective: 1.0,
        fortune: 0.7,
        chest_chance: 0.45,
        chest_quality: 0.4,
        xp_multiplier: 0.35,
        sell_price: 0.25,
    },
} satisfies Pickaxe;
