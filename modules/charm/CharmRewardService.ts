import type { Client } from 'discord.js';

import type { CharmDropResult } from '../../types/Charm';
import {
    CHARM_BASE_DROP_CHANCE,
    CHARM_LEVEL_DROP_BONUS,
    CHARM_MAX_DROP_CHANCE,
} from '../../config/BalanceConfig';
import { getOwnedCharm } from './CharmService';
import { rollChance, pickRandom } from '../../shared/utils/random';

export function calculateCharmDropChance(playerLevel: number): number {
    return Math.min(
        CHARM_MAX_DROP_CHANCE,
        CHARM_BASE_DROP_CHANCE + playerLevel * CHARM_LEVEL_DROP_BONUS,
    );
}

export function rollCharmDropChance(playerLevel: number): boolean {
    const chance = calculateCharmDropChance(playerLevel);
    return rollChance(chance);
}

export function rollCharmReward(
    client: Client,
    user: any,
): CharmDropResult | null {
    if (!rollCharmDropChance(user.level)) return null;

    const charms = Array.from(client.resources.charms.values());

    if (charms.length === 0) return null;

    const charm = pickRandom(charms);

    const owned = getOwnedCharm(user, charm.id);

    return {
        charmId: charm.id,
        name: charm.name,
        emoji: charm.emoji,
        level: owned?.level ?? 1,
        levelsGained: 0,
        isNew: !owned,
    };
}
