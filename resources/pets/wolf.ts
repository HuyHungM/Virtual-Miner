import type { Pet } from '../../types/Pet';

export default {
    id: 'wolf',
    name: 'Wolf',
    emoji: '1544019278129405952',
    rarity: 'uncommon',
    description: 'Sói trung thành, tăng hiệu quả khai thác.',
    baseStats: {
        effective: 0.04,
        fortune: 0.03,
    },
} satisfies Pet;
