import type { EnemyDef } from '../../types/Enemy';

export default {
    id: 'piglin',
    name: 'Piglin Hung Bạo',
    emoji: '1544263373976244296',
    combat_stats: {
        attack: 32,
        health: 150,
        defense: 12,
        attack_speed: 1.5,
    },
} satisfies EnemyDef;
