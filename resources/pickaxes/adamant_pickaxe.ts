import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp adamant',
    id: 'adamant_pickaxe',
    biomes: ['volcano_core'],
    price: 3_800_000_000,
    unlock_level: 250,
    description: 'Được tinh luyện từ địa tâm, mang uy lực bất hoại.',
    emoji: '1543198559350947850',
    buff: {
        effective: 2.15,
        fortune: 1.7,
        chest_chance: 0.88,
        chest_quality: 0.82,
        xp_multiplier: 0.85,
        sell_price: 0.75,
    },
} satisfies Pickaxe;
