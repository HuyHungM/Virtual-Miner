import type { EnemyDef } from '../../types/Enemy';

export default {
    id: 'piglin',
    name: 'Piglin',
    emoji: '1544267436260589588',
    combat_stats: {
        attack: 14,
        health: 90,
        defense: 6,
        attack_speed: 1,
    },
} satisfies EnemyDef;
