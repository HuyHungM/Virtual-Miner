import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp lục bảo',
    id: 'emerald_pickaxe',
    biomes: ['gem_highlands'],
    price: 90000000,
    unlock_level: 150,
    description: 'Ngọc lục bảo đậm đà, sức mạnh mạnh mẽ hơn.',
    emoji: '1543198576581283850',
    buff: {
        effective: 1.3,
        fortune: 1.0,
        chest_chance: 0.6,
        chest_quality: 0.55,
        xp_multiplier: 0.5,
        sell_price: 0.4,
    },
} satisfies Pickaxe;
