import type { Boost } from '../../types/Boost';

export default {
    id: 'effective_boost',
    boostId: 'mining_speed',
    name: 'Thuốc hiệu quả',
    description: 'Tăng 50% hiệu quả khai thác trong 30 phút',
    emoji: '1544346308943552532',
    price: 8,
    duration: 30,
    stat: 'effective',
    multiplier: 1.5,
} satisfies Boost;
