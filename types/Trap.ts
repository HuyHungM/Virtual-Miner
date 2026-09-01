export type TrapType = 'stun' | 'mining_slow' | 'piglin_robbery';

export type ChestKind =
    | 'normal'
    | 'stun'
    | 'mining_slow'
    | 'piglin_robbery';

export interface StunTrapState {
    type: 'stun';
    startedAt: Date;
    expiresAt: Date;
}

export interface MiningSlowTrapState {
    type: 'mining_slow';
    slowPercent: number;
    startedAt: Date;
    expiresAt: Date;
}

export type ActiveTrap = StunTrapState | MiningSlowTrapState;
