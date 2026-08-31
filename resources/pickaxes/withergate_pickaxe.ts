import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp tử vong',
    id: 'withergate_pickaxe',
    biomes: ['legendary_abyss'],
    price: 18_000_000_000,
    unlock_level: 500,
    description: 'Sức mạnh của tử thần, phá hủy mọi thứ.',
    emoji: '1543199127205056572',
    buff: {
        effective: 2.75,
        fortune: 2.15,
        chest_chance: 0.97,
        chest_quality: 0.93,
        xp_multiplier: 1.1,
        sell_price: 0.95,
    },
} satisfies Pickaxe;
