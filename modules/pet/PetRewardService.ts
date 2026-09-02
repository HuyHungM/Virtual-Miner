import type { Client } from 'discord.js';

import type { PetRarity, PetDropResult } from '../../types/Pet';
import {
    PET_BASE_DROP_CHANCE,
    PET_LEVEL_DROP_BONUS,
    PET_MAX_DROP_CHANCE,
    PET_DUPLICATE_XP_BASE,
    PET_RARITY_TIERS,
    PET_DROP_RARITY_WEIGHTS,
} from '../../config/BalanceConfig';
import { isPetOwned } from './PetService';
import { rollChance, pickRandom } from '../../shared/utils/random';

export function calculatePetDropChance(playerLevel: number): number {
    return Math.min(
        PET_MAX_DROP_CHANCE,
        PET_BASE_DROP_CHANCE + playerLevel * PET_LEVEL_DROP_BONUS,
    );
}

export function rollPetDropChance(playerLevel: number): boolean {
    const chance = calculatePetDropChance(playerLevel);
    return rollChance(chance);
}

export function rollPetRarity(): PetRarity {
    const entries = Object.entries(PET_DROP_RARITY_WEIGHTS) as [
        PetRarity,
        number,
    ][];
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * totalWeight;

    for (const [rarity, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return rarity;
    }

    return 'common';
}

export function rollPetReward(client: Client, user: any): PetDropResult | null {
    if (!rollPetDropChance(user.level)) return null;

    const rarity = rollPetRarity();

    const petsOfRarity = Array.from(client.resources.pets.values()).filter(
        (p) => p.rarity === rarity,
    );

    if (petsOfRarity.length === 0) return null;

    const pet = pickRandom(petsOfRarity);

    const isDuplicate = isPetOwned(user, pet.id);
    const xpAwarded = isDuplicate
        ? PET_DUPLICATE_XP_BASE * (PET_RARITY_TIERS[rarity] ?? 1)
        : 0;

    return {
        petId: pet.id,
        name: pet.name,
        emoji: pet.emoji,
        rarity: pet.rarity,
        isDuplicate,
        xpAwarded,
    };
}
