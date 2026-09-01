import { EMOJI_MILK } from '../../services/emoji/EmojiService';
import type { Potion } from '../../types/Potion';

export default {
    id: 'milk',
    name: 'Sữa',
    emoji: EMOJI_MILK,
    description: 'Gỡ bỏ ngay hiệu ứng Choáng hoặc Làm Chậm đang kích hoạt.',
    effect: 'milk',
    price: 20,
} satisfies Potion;
