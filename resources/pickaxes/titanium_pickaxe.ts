import type { Pickaxe } from '../../types/Pickaxe';

export default {
    name: 'Cúp titan',
    id: 'titanium_pickaxe',
    biomes: ['volcano_core'],
    price: 1_500_000_000,
    unlock_level: 250,
    description: 'Địa hỏa nung tôi, nhưng chẳng thể khuất phục.',
    emoji: '1543198563276951674',
    buff: {
        effective: 1.9,
        fortune: 1.5,
        chest_chance: 0.82,
        chest_quality: 0.75,
        xp_multiplier: 0.75,
        sell_price: 0.65,
    },
} satisfies Pickaxe;
