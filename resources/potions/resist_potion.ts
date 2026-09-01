import { EMOJI_RESIST } from '../../services/emoji/EmojiService';
import type { Potion } from '../../types/Potion';

export default {
    id: 'resist_potion',
    name: 'Thuốc kháng hiệu ứng',
    emoji: EMOJI_RESIST,
    description:
        'Ngăn chặn Bẫy Choáng và Bẫy Làm Chậm trong 10 phút. Uống trước khi mở rương.',
    effect: 'resist',
    price: 10,
} satisfies Potion;
