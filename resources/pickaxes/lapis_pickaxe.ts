import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp lưu ly',
    id: 'lapis_pickaxe',
    biomes: ['plains'],
    price: 60000,
    unlock_level: 1,
    description: 'Lưu sắc soi đường, tài bảo ẩn sâu chờ đợi.',
    emoji: '1543192461340442664',
    buff: {
        effective: 0.4,
        fortune: 0.2,
        chest_chance: 0.15,
        chest_quality: 0.1,
        xp_multiplier: 0,
        sell_price: 0,
    },
} satisfies Pickaxe;
