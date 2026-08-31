import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp ngọc bích',
    id: 'aquamarine_pickaxe',
    biomes: ['gem_highlands'],
    price: 320000000,
    unlock_level: 150,
    description: 'Ngọc nước trong xanh, sức mạnh tinh tế.',
    emoji: '1543192463215165562',
    buff: {
        effective: 1.55,
        fortune: 1.2,
        chest_chance: 0.7,
        chest_quality: 0.65,
        xp_multiplier: 0.6,
        sell_price: 0.5,
    },
} satisfies Pickaxe;
