import type { Buff } from './Buff';

export type CharmStat =
    | 'effective'
    | 'fortune'
    | 'chest_chance'
    | 'chest_quality'
    | 'xp_multiplier'
    | 'sell_price';

export interface Charm {
    id: string;
    name: string;
    emoji: string;
    stat: CharmStat;
    baseValue: number;
    description?: string;
}

export interface OwnedCharm {
    charmId: string;
    level: number;
    copies: number;
}

export interface CharmDropResult {
    charmId: string;
    name: string;
    emoji: string;
    level: number;
    levelsGained: number;
    isNew: boolean;
}
