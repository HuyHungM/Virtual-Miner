import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: "Cúp Nel'varian",
    id: 'nelvarian_pickaxe',
    biomes: ['legendary_abyss'],
    price: 50_000_000_000,
    unlock_level: 500,
    description: 'Nelvarian — di vật của một kỷ nguyên đã bị lãng quên.',
    emoji: '1543198557564309645',
    buff: {
        effective: 3.2,
        fortune: 2.6,
        chest_chance: 1.1,
        chest_quality: 1.05,
        xp_multiplier: 1.4,
        sell_price: 1.1,
    },
} satisfies Pickaxe;
