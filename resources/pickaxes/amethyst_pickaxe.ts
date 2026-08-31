import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp thạch anh tím',
    id: 'amethyst_pickaxe',
    biomes: ['ancient_forest'],
    price: 15000000,
    unlock_level: 50,
    description: 'Tím huyền bí, sức mạnh vượt trội rừng cổ.',
    emoji: '1543199122708897923',
    buff: {
        effective: 1.1,
        fortune: 0.8,
        chest_chance: 0.5,
        chest_quality: 0.45,
        xp_multiplier: 0.4,
        sell_price: 0.3,
    },
} satisfies Pickaxe;
