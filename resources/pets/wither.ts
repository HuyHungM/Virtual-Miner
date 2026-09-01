import type { Pet } from '../../types/Pet';

export default {
    id: 'wither',
    name: 'Wither',
    emoji: '1544202510573641819',
    rarity: 'mythic',
    description: 'Wither - Kẻ mang theo hơi thở của tận thế.',
    baseStats: {
        effective: 0.1,
        fortune: 0.1,
        xp_multiplier: 0.08,
        chest_chance: 0.07,
        chest_quality: 0.07,
    },
} satisfies Pet;
