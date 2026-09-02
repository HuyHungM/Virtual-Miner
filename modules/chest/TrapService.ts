import type { ClientSession } from 'mongoose';
import type { Client } from 'discord.js';

import User from '../../models/User';
import { getEquippedPet } from '../pet/PetService';
import { hasActiveBoost, getActiveBoosts } from '../boost/BoostShopService';
import type { ActiveTrap, TrapType } from '../../types/Trap';

export const IMMUNITY_BOOST_ID = 'trap_resist';
export const MILK_ID = 'milk';
export const RESIST_POTION_ID = 'resist_potion';

/**
 * Persisted active trap handling. Expiration is checked against stored
 * timestamps so expired effects are treated as absent — no in-memory timers.
 */

/** Returns the player's non-expired active trap, or null. */
export function getActiveTrap(user: any): ActiveTrap | null {
    const trap = user?.activeTrap;
    if (!trap || !trap.type) return null;

    const expiresAt = new Date(trap.expiresAt).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

    return trap as ActiveTrap;
}

export function isStunned(user: any): boolean {
    return getActiveTrap(user)?.type === 'stun';
}

export function getStunRemainingMs(user: any): number {
    const trap = getActiveTrap(user);
    if (!trap || trap.type !== 'stun') return 0;
    return Math.max(0, new Date(trap.expiresAt).getTime() - Date.now());
}

/** Returns the active mining slow modifier (0.45 etc), or 0 when none. */
export function getMiningSlowModifier(user: any): number {
    const trap = getActiveTrap(user);
    if (!trap || trap.type !== 'mining_slow') return 0;
    return trap.slowPercent ?? 0;
}

/** Applies a stun for `durationMinutes`. Replaces any prior trap. */
export function applyStun(
    userId: string,
    durationMinutes: number,
    session?: ClientSession,
) {
    const now = new Date();
    return User.findOneAndUpdate(
        { userId },
        {
            $set: {
                activeTrap: {
                    type: 'stun',
                    startedAt: now,
                    expiresAt: new Date(
                        now.getTime() + durationMinutes * 60_000,
                    ),
                },
            },
        },
        { session },
    );
}

/** Applies a mining slow for `durationMinutes`. Replaces any prior trap. */
export function applyMiningSlow(
    userId: string,
    slowPercent: number,
    durationMinutes: number,
    session?: ClientSession,
) {
    const now = new Date();
    return User.findOneAndUpdate(
        { userId },
        {
            $set: {
                activeTrap: {
                    type: 'mining_slow',
                    slowPercent,
                    startedAt: now,
                    expiresAt: new Date(
                        now.getTime() + durationMinutes * 60_000,
                    ),
                },
            },
        },
        { session },
    );
}

/** Clears the active trap (used by Milk). */
export function clearActiveTrap(userId: string, session?: ClientSession) {
    return User.findOneAndUpdate(
        { userId },
        { $set: { activeTrap: null } },
        { session },
    );
}

/** Records the last mining time for cooldown bookkeeping. */
export function setLastMineAt(userId: string, session?: ClientSession) {
    return User.findOneAndUpdate(
        { userId },
        { $set: { lastMineAt: new Date() } },
        { session },
    );
}

// ============================================
// Immunity (Effect Resistance Potion)
// ============================================

/** Whether the anti-trap immunity is active. */
export function hasTrapImmunity(user: any): boolean {
    return hasActiveBoost(user, IMMUNITY_BOOST_ID);
}

export function getImmunityRemainingMs(user: any): number {
    const active = getActiveBoosts(user);
    const found = active.find((b: any) => b.boostId === IMMUNITY_BOOST_ID);
    if (!found) return 0;
    return Math.max(0, new Date(found.expiresAt).getTime() - Date.now());
}

// ============================================
// Combat pet (Piglin countermeasure)
// ============================================

/** True if the player has a combat-capable pet equipped. */
export function isCombatPetEquipped(client: Client, user: any): boolean {
    const equipped = getEquippedPet(user);
    if (!equipped) return false;
    const def = client.resources.pets.get(equipped.petId);
    return def?.combat === true;
}
