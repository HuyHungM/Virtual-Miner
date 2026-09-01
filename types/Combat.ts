export interface CombatStats {
    attack: number;
    health: number;
    defense: number;
    attack_speed?: number;
}

/** An actor's effective, ready-to-use combat numbers for a fight. */
export interface CombatActorStats {
    maxHealth: number;
    health: number;
    attack: number;
    defense: number;
    attackSpeed: number;
}

export type CombatWinner = 'pet' | 'enemy';

export interface CombatResult {
    winner: CombatWinner;
    petRemainingHealth: number;
    enemyRemainingHealth: number;
    turns: number;
}
