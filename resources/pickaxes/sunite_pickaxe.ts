import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp sunite',
    id: 'sunite_pickaxe',
    biomes: ['legendary_abyss'],
    price: 26_000_000_000,
    unlock_level: 500,
    description: 'Sunite rực sáng như mặt trời, sức mạnh vô song.',
    emoji: '1543199125011435571',
    buff: {
        effective: 2.9,
        fortune: 2.3,
        chest_chance: 1.0,
        chest_quality: 0.95,
        xp_multiplier: 1.2,
        sell_price: 1.0,
    },
} satisfies Pickaxe;
