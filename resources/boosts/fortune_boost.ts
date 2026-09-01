import type { Boost } from '../../types/Boost';

export default {
    id: 'fortune_boost',
    boostId: 'fortune',
    name: 'Thuốc may mắn',
    description: 'Tăng 50% may mắn trong 30 phút',
    emoji: '1544344248067817574',
    price: 8,
    duration: 30,
    stat: 'fortune',
    multiplier: 1.5,
} satisfies Boost;
