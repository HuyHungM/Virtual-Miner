import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp phỉ thúy',
    id: 'verdite_pickaxe',
    biomes: ['gem_highlands'],
    price: 550000000,
    unlock_level: 150,
    description: 'Phỉ thúy xanh thẫm, cân bằng hoàn hảo.',
    emoji: '1543198565348675654',
    buff: {
        effective: 1.65,
        fortune: 1.25,
        chest_chance: 0.72,
        chest_quality: 0.68,
        xp_multiplier: 0.62,
        sell_price: 0.55,
    },
} satisfies Pickaxe;
