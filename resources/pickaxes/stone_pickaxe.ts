import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp đá',
    id: 'stone_pickaxe',
    biomes: ['plains'],
    price: 1500,
    unlock_level: 1,
    description: 'Từ đá thô sơ, hành trình khai phá bắt đầu.',
    emoji: '1543192475374583818',
    buff: {
        effective: 0.15,
        fortune: 0.1,
        chest_chance: 0,
        chest_quality: 0,
        xp_multiplier: 0,
        sell_price: 0,
    },
} satisfies Pickaxe;
