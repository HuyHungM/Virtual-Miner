import type { Boost } from '../../types/Boost';

export default {
    id: 'effective_boost_10',
    boostId: 'mining_speed',
    name: 'Thuốc hiệu quả 10p',
    description: 'Tăng 50% hiệu quả khai thác trong 10 phút',
    emoji: '1543999999999999101',
    price: 4,
    duration: 10,
    stat: 'effective',
    multiplier: 1.5,
} satisfies Boost;
