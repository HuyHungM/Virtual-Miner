import type { Boost } from '../../types/Boost';

export default {
    id: 'chest_chance_boost',
    boostId: 'chest_chance',
    name: 'Thuốc rương kho báu',
    description: 'Tăng 50% tỷ lệ tìm rương trong 30 phút',
    emoji: '1543999999999999007',
    price: 10,
    duration: 30,
    stat: 'chest_chance',
    multiplier: 1.5,
} satisfies Boost;
