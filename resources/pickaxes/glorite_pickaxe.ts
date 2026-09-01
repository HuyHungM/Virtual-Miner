import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp huy hoàng',
    id: 'glorite_pickaxe',
    biomes: ['legendary_abyss'],
    price: 36_000_000_000,
    unlock_level: 500,
    description: 'Từ nơi không ánh sáng, huy quang đã được sinh ra.',
    emoji: '1543199129490956339',
    buff: {
        effective: 3.05,
        fortune: 2.45,
        chest_chance: 1.05,
        chest_quality: 1.0,
        xp_multiplier: 1.3,
        sell_price: 1.05,
    },
} satisfies Pickaxe;
