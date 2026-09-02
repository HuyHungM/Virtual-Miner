import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp Gỗ',
    id: 'wooden_pickaxe',
    biomes: ['plains'],
    price: 0,
    unlock_level: 1,
    description: 'Mộc khí sơ khai, khởi nguyên của hành trình khai phá.',
    emoji: '1543190102904279110',
    buff: {
        effective: 0,
        fortune: 0,
        chest_chance: 0,
        chest_quality: 0,
        xp_multiplier: 0,
        sell_price: 0,
    },
} satisfies Pickaxe;
