import type { Pet } from '../../types/Pet';

export default {
    id: 'pig',
    name: 'Heo',
    emoji: '1544019296051666997',
    rarity: 'common',
    description: 'Mang theo chút may mắn trên mọi hành trình.',
    baseStats: {
        chest_chance: 0.02,
        fortune: 0.02,
    },
} satisfies Pet;
