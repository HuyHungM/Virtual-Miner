import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp dung nham',
    id: 'lava_pickaxe',
    biomes: ['volcano_core'],
    price: 7_500_000_000,
    unlock_level: 250,
    description: 'Hỏa diễm nung đỏ, sức mạnh từ lòng đất trỗi dậy.',
    emoji: '1543192465279025262',
    buff: {
        effective: 2.45,
        fortune: 1.9,
        chest_chance: 0.92,
        chest_quality: 0.88,
        xp_multiplier: 0.95,
        sell_price: 0.85,
    },
} satisfies Pickaxe;
