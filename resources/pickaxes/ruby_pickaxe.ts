import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp hồng ngọc',
    id: 'ruby_pickaxe',
    biomes: ['gem_highlands'],
    price: 180000000,
    unlock_level: 150,
    description: 'Hồng rực lửa, sức mạnh bùng nổ.',
    emoji: '1543198574605508759',
    buff: {
        effective: 1.45,
        fortune: 1.1,
        chest_chance: 0.65,
        chest_quality: 0.6,
        xp_multiplier: 0.55,
        sell_price: 0.45,
    },
} satisfies Pickaxe;
