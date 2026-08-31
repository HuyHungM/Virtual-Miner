import type { Pet } from '../../types/Pet';

export default {
    id: 'warden',
    name: 'Warden',
    emoji: '1544019888329326663',
    rarity: 'legendary',
    description: 'Warden siêu phàm, cảm nhận mọi kho báu sâu trong lòng đất.',
    baseStats: {
        chest_chance: 0.08,
        chest_quality: 0.07,
        fortune: 0.09,
        sell_price: 0.06,
    },
} satisfies Pet;
