import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp Thạch Anh',
    id: 'quartz_pickaxe',
    biomes: ['ancient_forest'],
    price: 900000,
    unlock_level: 50,
    description: 'Tinh thể vô sắc, ẩn chứa sức mạnh của cổ lâm.',
    emoji: '1543198568058454196',
    buff: {
        effective: 0.8,
        fortune: 0.5,
        chest_chance: 0.35,
        chest_quality: 0.3,
        xp_multiplier: 0.25,
        sell_price: 0.15,
    },
} satisfies Pickaxe;
