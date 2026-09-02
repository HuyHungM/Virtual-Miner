import type { Pet } from '../../types/Pet';

export default {
    id: 'ender_dragon',
    name: 'Rồng Ender',
    emoji: '1544040264811942059',
    rarity: 'mythic',
    description: 'Ender Dragon - Chúa tể của tận cùng.',
    baseStats: {
        effective: 0.12,
        fortune: 0.12,
        xp_multiplier: 0.1,
        chest_chance: 0.08,
        chest_quality: 0.08,
    },
    combat: true,
    combat_stats: {
        attack: 85,
        health: 220,
        defense: 40,
    },
} satisfies Pet;
