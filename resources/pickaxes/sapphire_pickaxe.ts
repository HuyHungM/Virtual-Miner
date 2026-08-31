import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp lam ngọc',
    id: 'sapphire_pickaxe',
    biomes: ['gem_highlands'],
    price: 40000000,
    unlock_level: 150,
    description: 'Xanh biếc cao nguyên ngọc, bước vào thời đại quý tộc.',
    emoji: '1543198572445573192',
    buff: {
        effective: 1.2,
        fortune: 0.9,
        chest_chance: 0.55,
        chest_quality: 0.5,
        xp_multiplier: 0.45,
        sell_price: 0.35,
    },
} satisfies Pickaxe;
