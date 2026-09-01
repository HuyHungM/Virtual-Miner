import type { CombatStats } from './Combat';

export interface EnemyDef {
    id: string;
    name: string;
    emoji: string;
    combat_stats: CombatStats;
}
