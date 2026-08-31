import type { Client } from 'discord.js';

import type { Buff } from '../../types/Buff';
import { getEquippedPet, computePetStatBonus } from './PetService';

const PET_BONUS_STATS: (keyof Buff)[] = [
    'effective',
    'fortune',
    'xp_multiplier',
    'chest_chance',
    'chest_quality',
    'sell_price',
];

export function getPetBonusStats(
    client: Client,
    user: any,
): Partial<Buff> {
    const equipped = getEquippedPet(user);

    if (!equipped) return {};

    const petDef = client.resources.pets.get(equipped.petId);

    if (!petDef) return {};

    const bonuses: Partial<Buff> = {};

    for (const stat of PET_BONUS_STATS) {
        const base = petDef.baseStats[stat];

        if (base !== undefined && base !== 0) {
            bonuses[stat] = computePetStatBonus(base, equipped.level);
        }
    }

    return bonuses;
}

export function getPetBonusForStat(
    client: Client,
    user: any,
    stat: keyof Buff,
): number {
    const bonuses = getPetBonusStats(client, user);

    return bonuses[stat] ?? 0;
}
