import type { Buff } from './Buff';

export type PetRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Pet {
    id: string;
    name: string;
    emoji: string;
    rarity: PetRarity;
    description: string;
    baseStats: Partial<Buff>;
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
