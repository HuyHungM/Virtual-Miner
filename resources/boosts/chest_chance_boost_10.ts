import type { Boost } from '../../types/Boost';

export default {
    id: 'chest_chance_boost_10',
    boostId: 'chest_chance',
    name: 'Thuốc rương kho báu 10p',
    description: 'Tăng 50% tỷ lệ tìm rương trong 10 phút',
    emoji: '1544344252320981092',
    price: 5,
    duration: 10,
    stat: 'chest_chance',
    multiplier: 1.5,
} satisfies Boost;
