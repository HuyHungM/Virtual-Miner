import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp Mithril',
    id: 'mithril_pickaxe',
    biomes: ['hell_core'],
    price: 2_500_000_000,
    unlock_level: 250,
    description: 'Từ lòng núi sâu, ngân quang dần thức tỉnh.',
    emoji: '1543198561376935987',
    buff: {
        effective: 2.05,
        fortune: 1.6,
        chest_chance: 0.85,
        chest_quality: 0.8,
        xp_multiplier: 0.8,
        sell_price: 0.7,
    },
} satisfies Pickaxe;
