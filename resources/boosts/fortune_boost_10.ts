import type { Boost } from '../../types/Boost';

export default {
    id: 'fortune_boost_10',
    boostId: 'fortune',
    name: 'Thuốc may mắn 10p',
    description: 'Tăng 50% may mắn trong 10 phút',
    emoji: '1544344248067817574',
    price: 4,
    duration: 10,
    stat: 'fortune',
    multiplier: 1.5,
} satisfies Boost;
