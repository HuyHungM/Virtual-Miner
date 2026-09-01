import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp than',
    id: 'coal_pickaxe',
    biomes: ['plains'],
    price: 5000,
    unlock_level: 1,
    description: 'Sinh từ lòng đất, đồng hành cùng bước chân đầu tiên',
    emoji: '1543198580809138296',
    buff: {
        effective: 0.25,
        fortune: 0.15,
        chest_chance: 0,
        chest_quality: 0,
        xp_multiplier: 0.05,
        sell_price: 0,
    },
} satisfies Pickaxe;
