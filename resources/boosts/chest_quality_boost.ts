import type { Boost } from '../../types/Boost';

export default {
    id: 'chest_quality_boost',
    boostId: 'chest_quality',
    name: 'Thuốc chất lượng rương',
    description: 'Tăng 50% chất lượng rương trong 30 phút',
    emoji: '1543999999999999008',
    price: 10,
    duration: 30,
    stat: 'chest_quality',
    multiplier: 1.5,
} satisfies Boost;
