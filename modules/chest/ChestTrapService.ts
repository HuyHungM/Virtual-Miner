import type { ClientSession } from 'mongoose';
import type { Client } from 'discord.js';

import type { ChestKind, TrapType } from '../../types/Trap';
import { getInventory, removeItem } from '../inventory/InventoryService';
import { getUser, removeActiveBoost } from '../user/UserService';
import { MINING_SLOW_DURATION } from '../../config/BalanceConfig';
import {
    hasTrapImmunity,
    applyStun,
    applyMiningSlow,
    IMMUNITY_BOOST_ID,
} from './TrapService';
import {
    getEquippedCombatPet,
    getPetCombatActor,
    buildEnemyActor,
    resolveCombat,
} from '../combat/CombatService';
import type { CombatResult } from '../../types/Combat';
import {
    rollChestKind,
    rollTrapType,
    rollStunDuration,
    rollSlowPercent,
    rollRobberyPercent,
} from './TrapRollService';

export interface TrapOutcome {
    kind: ChestKind;
    /** True when a trapped chest was fully prevented by immunity. */
    prevented?: boolean;
    trap?: {
        type: TrapType;
        durationMinutes?: number;
        slowPercent?: number;
        stolenPercent?: number;
    };
    defended?: boolean;
    stolenPercent?: number;
    /** Present when a combat pet fought the piglin. */
    combat?: CombatResult;
}

/**
 * Resolves a single chest opening inside an existing transaction.
 *
 * - 80% Normal Chest → normal reward object unchanged.
 * - 20% Trapped Chest → rolls EXACTLY ONE trap, applies countermeasures,
 *   persists state, and (for Piglin) removes ores atomically.
 *
 * Performs all necessary DB writes using `session`.
 */
export async function resolveChest(
    client: Client,
    userId: string,
    level: number,
    session: ClientSession,
): Promise<TrapOutcome> {
    const isNormal = rollChestKind();

    if (isNormal) {
        return { kind: 'normal' };
    }

    // Trapped chest: roll exactly one trap from those available at this level.
    const trap = rollTrapType(level);

    // Immunity prevents Stun and Mining Slow (not Piglin).
    if (trap !== 'piglin_robbery' && (await hasImmunity(userId, session))) {
        await removeActiveBoost(userId, IMMUNITY_BOOST_ID, session);
        return { kind: 'normal', prevented: true };
    }

    if (trap === 'stun') {
        const durationMinutes = rollStunDuration(level);
        await applyStun(userId, durationMinutes, session);
        return {
            kind: 'stun',
            trap: { type: 'stun', durationMinutes },
        };
    }

    if (trap === 'mining_slow') {
        const slowPercent = rollSlowPercent(level);
        await applyMiningSlow(
            userId,
            slowPercent,
            MINING_SLOW_DURATION,
            session,
        );
        return {
            kind: 'mining_slow',
            trap: { type: 'mining_slow', slowPercent },
        };
    }

    // Piglin Robbery
    const user = await getUser(userId, session);

    // Resolve combat FIRST. Ores are only ever removed AFTER combat — never
    // before — so a defending pet has a real chance to stop the robbery.
    const combatPet = getEquippedCombatPet(client, user);
    let combat: CombatResult | null = null;

    if (combatPet) {
        const piglin = client.resources.enemies.get('piglin');
        if (piglin) {
            const petActor = getPetCombatActor(
                combatPet.def,
                combatPet.owned.level,
            );
            const enemyActor = buildEnemyActor(piglin);
            combat = resolveCombat(petActor, enemyActor);
        }
    }

    if (combat && combat.winner === 'pet') {
        return {
            kind: 'piglin_robbery',
            defended: true,
            combat,
        };
    }

    const stolenPercent = rollRobberyPercent(level);
    await removeOrePercent(userId, stolenPercent, session);

    return {
        kind: 'piglin_robbery',
        defended: false,
        stolenPercent,
        trap: { type: 'piglin_robbery', stolenPercent },
        ...(combat ? { combat } : {}),
    };
}

async function hasImmunity(
    userId: string,
    session: ClientSession,
): Promise<boolean> {
    const user = await getUser(userId, session);
    return hasTrapImmunity(user);
}

/** Removes `percent` (0..1) of the player's total ore quantity. */
async function removeOrePercent(
    userId: string,
    percent: number,
    session: ClientSession,
) {
    const inventory = await getInventory(userId, session);
    if (!inventory || !inventory.items?.length) return;

    let total = 0;
    for (const item of inventory.items) {
        total += Number(item.quantity);
    }
    if (total <= 0) return;

    let toRemove = Math.floor(total * percent);
    for (const item of inventory.items) {
        if (toRemove <= 0) break;
        const take = Math.min(Number(item.quantity), toRemove);
        if (take > 0) {
            await removeItem(userId, item.itemId, take, session);
            toRemove -= take;
        }
    }
}
