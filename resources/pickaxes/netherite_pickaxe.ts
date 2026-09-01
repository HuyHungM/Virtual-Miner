import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp netherite',
    id: 'netherite_pickaxe',
    biomes: ['volcano_core'],
    price: 5_500_000_000,
    unlock_level: 250,
    description:
        'Từ bóng tối và địa hỏa, một thứ kim loại bất diệt thành hình.',
    emoji: '1543192466650570763',
    buff: {
        effective: 2.3,
        fortune: 1.8,
        chest_chance: 0.9,
        chest_quality: 0.85,
        xp_multiplier: 0.9,
        sell_price: 0.8,
    },
} satisfies Pickaxe;
