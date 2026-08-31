import type { Pet } from '../../types/Pet';

export default {
    id: 'ender_dragon',
    name: 'Ender Dragon',
    emoji: '1544040264811942059',
    rarity: 'mythic',
    description: 'Rồng Ender tối thượng, chủ nhân của mọi kho báu.',
    baseStats: {
        effective: 0.12,
        fortune: 0.12,
        xp_multiplier: 0.1,
        chest_chance: 0.08,
        chest_quality: 0.08,
    },
} satisfies Pet;
