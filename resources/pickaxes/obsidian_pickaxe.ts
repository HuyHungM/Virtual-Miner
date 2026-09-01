import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp hắc diện thạch',
    id: 'obsidian_pickaxe',
    biomes: ['legendary_abyss'],
    price: 12_000_000_000,
    unlock_level: 500,
    description: 'Từ vực sâu hắc ám, kết tinh thành một khối bất diệt.',
    emoji: '1543199279404027995',
    buff: {
        effective: 2.6,
        fortune: 2.0,
        chest_chance: 0.95,
        chest_quality: 0.9,
        xp_multiplier: 1.0,
        sell_price: 0.9,
    },
} satisfies Pickaxe;
