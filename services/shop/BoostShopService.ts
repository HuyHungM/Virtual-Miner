import type { Client } from 'discord.js';
import type { Boost } from '../../types/Boost';
import type { ActiveBoost } from '../../types/ActiveBoost';

export function getBoosts(client: Client): Boost[] {
    return [...client.resources.boosts.values()];
}

export function getBoost(client: Client, boostId: string): Boost | undefined {
    return client.resources.boosts.get(boostId);
}

/** First boost resource belonging to a boost group id (e.g. 'fortune'). */
export function getBoostByGroup(
    client: Client,
    boostId: string,
): Boost | undefined {
    for (const boost of client.resources.boosts.values()) {
        if (boost.boostId === boostId) return boost;
    }
    return undefined;
}

function normalizeActiveBoosts(user: any): ActiveBoost[] {
    const raw = user?.active_boosts;
    if (!Array.isArray(raw)) return [];

    const now = Date.now();

    return raw
        .filter((b: any) => b && new Date(b.expiresAt).getTime() > now)
        .map((b: any) => ({
            boostId: b.boostId,
            expiresAt: new Date(b.expiresAt),
        }));
}

export function getActiveBoosts(user: any): ActiveBoost[] {
    return normalizeActiveBoosts(user);
}

export function hasActiveBoost(user: any, boostId: string): boolean {
    return getActiveBoosts(user).some((b) => b.boostId === boostId);
}

/** Multiplier of an active boost type, or null when not active. */
export function getBoostEffect(
    client: Client,
    user: any,
    boostId: string,
): number | null {
    if (!hasActiveBoost(user, boostId)) return null;
    return getBoostByGroup(client, boostId)?.multiplier ?? null;
}

/** Remaining minutes for a specific active boost type (0 when absent/expired). */
export function getBoostRemainingTime(
    user: any,
    boostId: string,
): number {
    const active = getActiveBoosts(user).find((b) => b.boostId === boostId);
    if (!active) return 0;
    return Math.max(
        0,
        Math.floor((active.expiresAt.getTime() - Date.now()) / 1000 / 60),
    );
}
