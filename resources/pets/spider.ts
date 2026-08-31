import type { Pet } from '../../types/Pet';

export default {
    id: 'spider',
    name: 'Spider',
    emoji: '1544019290070585494',
    rarity: 'rare',
    description: 'Nhện bóng đêm,expert trong việc tìm quặng hiếm.',
    baseStats: {
        fortune: 0.06,
        chest_chance: 0.04,
    },
} satisfies Pet;
