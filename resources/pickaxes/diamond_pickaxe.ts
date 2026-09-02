import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp Kim Cương',
    id: 'diamond_pickaxe',
    biomes: ['gem_highlands'],
    price: 900000000,
    unlock_level: 150,
    description: 'Tinh thể lam quang, lưu dấu kẻ chạm đến đỉnh cao',
    emoji: '1543189932074336307',
    buff: {
        effective: 1.8,
        fortune: 1.4,
        chest_chance: 0.8,
        chest_quality: 0.7,
        xp_multiplier: 0.7,
        sell_price: 0.6,
    },
} satisfies Pickaxe;
