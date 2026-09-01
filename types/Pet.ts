import type { Buff } from './Buff';
import type { CombatStats } from './Combat';

export type PetRarity =
    'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Pet {
    id: string;
    name: string;
    emoji: string;
    rarity: PetRarity;
    description: string;
    baseStats: Partial<Buff>;
    /** Combat-capable pets can defend against hostile events like Piglin Robbery. */
    combat?: boolean;
    /** Effective combat stats when `combat` is true. Scaled by pet level. */
    combat_stats?: CombatStats;
}

export interface OwnedPet {
    petId: string;
    level: number;
    xp: number;
}

export interface PetDropResult {
    petId: string;
    name: string;
    emoji: string;
    rarity: PetRarity;
    isDuplicate: boolean;
    xpAwarded: number;
}
