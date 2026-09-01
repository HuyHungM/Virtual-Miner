import type { ClientSession } from 'mongoose';
import type { Client } from 'discord.js';

import type { BackpackDef, OwnedBackpack } from '../../types/Backpack';
import {
    MINING_MIN_COOLDOWN,
    DEFAULT_BIOME_COOLDOWN,
} from '../balance/BalanceConfig';
import { getUser, updateBalance } from '../user/UserService';
import type { Biome } from '../../types/Biome';

export function getBackpack(
    client: Client,
    backpackId: string,
): BackpackDef | undefined {
    return client.resources.backpacks.get(backpackId);
}

export function getBackpacksForBiome(
    client: Client,
    biomeId: string,
): BackpackDef[] {
    return [...client.resources.backpacks.values()]
        .filter((b) => b.biome === biomeId)
        .sort((a, b) => a.tier - b.tier);
}

function getBiomeOrder(client: Client): Biome[] {
    return [...client.resources.biomes.values()].sort(
        (a, b) => a.unlock_level - b.unlock_level,
    );
}

function ownsAllBackpacks(client: Client, user: any, biomeId: string): boolean {
    return getBackpacksForBiome(client, biomeId).every((b) =>
        isBackpackOwned(user, b.id),
    );
}

/** Biomes whose backpack shop is unlocked: level gate + previous biome's 4 backpacks. */
export function getUnlockedBackpackBiomes(client: Client, user: any): Biome[] {
    const biomes = getBiomeOrder(client);

    return biomes.filter((biome, index) => {
        if (user.level < biome.unlock_level) return false;
        if (index === 0) return true;
        const prevBiome = biomes[index - 1];
        return prevBiome ? ownsAllBackpacks(client, user, prevBiome.id) : true;
    });
}

/** Next biome whose backpacks are not yet unlocked, or null when all are open. */
export function getNextBackpackUnlock(
    client: Client,
    user: any,
): { biome: Biome; levelLocked: boolean; prevBiomeComplete: boolean } | null {
    const biomes = getBiomeOrder(client);
    const unlocked = getUnlockedBackpackBiomes(client, user);
    const unlockedIds = new Set(unlocked.map((b) => b.id));

    for (const biome of biomes) {
        if (unlockedIds.has(biome.id)) continue;

        const index = biomes.findIndex((b) => b.id === biome.id);
        const prevBiome = index > 0 ? biomes[index - 1] : undefined;
        const prevBiomeComplete = prevBiome
            ? ownsAllBackpacks(client, user, prevBiome.id)
            : true;

        return {
            biome,
            levelLocked: user.level < biome.unlock_level,
            prevBiomeComplete,
        };
    }

    return null;
}

/**
 * One page per unlocked biome, exactly 4 backpacks per page.
 * Pages index over unlocked biomes only.
 */
export function getBackpackBiomePage(client: Client, user: any, page: number) {
    const unlocked = getUnlockedBackpackBiomes(client, user);

    const totalPages = Math.max(1, unlocked.length);
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));

    const biome = unlocked[currentPage];

    return {
        biome,
        backpacks: biome ? getBackpacksForBiome(client, biome.id) : [],
        page: currentPage,
        totalPages,
    };
}

export function getEquippedBackpack(user: any): OwnedBackpack | undefined {
    if (!user.equippedBackpack) return undefined;
    return user.backpacks?.find(
        (b: OwnedBackpack) => b.backpackId === user.equippedBackpack,
    );
}

export function isBackpackOwned(user: any, backpackId: string): boolean {
    return user.backpacks?.some(
        (b: OwnedBackpack) => b.backpackId === backpackId,
    );
}

/**
 * Centralized backpack cooldown reduction based on the backpack's biome and
 * the current mining biome's position in the biome progression:
 *   previous biome (M < N)  → 1.00s (fixed, tier-independent)
 *   own biome     (M === N) → tier × 0.25s
 *   future biome  (M > N)   → 0
 */
export function getBackpackCooldownReduction(
    client: Client,
    backpack: BackpackDef,
    currentBiomeId: string,
): number {
    const biomes = getBiomeOrder(client);
    const backpackIndex = biomes.findIndex((b) => b.id === backpack.biome);
    const currentIndex = biomes.findIndex((b) => b.id === currentBiomeId);

    if (backpackIndex < 0 || currentIndex < 0) return 0;

    if (currentIndex < backpackIndex) return 1.0;

    if (currentIndex === backpackIndex) return backpack.tier * 0.25;

    return 0;
}

/**
 * Cooldown reduction granted by the equipped backpack based on the current
 * mining biome's position in the biome progression.
 */
export function getBackpackReduction(
    client: Client,
    user: any,
    currentBiomeId: string,
): number {
    const equipped = getEquippedBackpack(user);
    if (!equipped) return 0;

    const def = getBackpack(client, equipped.backpackId);
    if (!def) return 0;

    return getBackpackCooldownReduction(client, def, currentBiomeId);
}

/**
 * Centralized cooldown calculation.
 *   final = max(MINING_MIN_COOLDOWN, (biomeBase - backpackReduction) * (1 + slowModifier))
 */
export function calcFinalCooldown(
    client: Client,
    user: any,
    biomeId: string,
    slowModifier = 0,
): number {
    const biome = client.resources.biomes.get(biomeId);
    const base = biome?.cooldown ?? DEFAULT_BIOME_COOLDOWN;

    const reduction = getBackpackReduction(client, user, biomeId);

    const value = Math.max(0, base - reduction) * (1 + slowModifier);

    return Math.max(MINING_MIN_COOLDOWN, value);
}

function assertBiomeUnlocked(client: Client, user: any, biomeId: string) {
    const biomes = getBiomeOrder(client);
    const index = biomes.findIndex((b) => b.id === biomeId);
    if (index === -1) throw new Error('BIOME_LOCKED');

    const biome = biomes[index];
    if (!biome) throw new Error('BIOME_LOCKED');
    if (user.level < biome.unlock_level) throw new Error('BIOME_LOCKED');
    if (index === 0) return;

    const prevBiome = biomes[index - 1];
    if (prevBiome && !ownsAllBackpacks(client, user, prevBiome.id)) {
        throw new Error('PREVIOUS_BIOME_REQUIRED');
    }
}

/**
 * Validates progression (biome gate + tier order) and buys a backpack
 * atomically, then auto-equips it (equipped = latest purchased tier).
 * Throws typed errors: USER_NOT_FOUND / BACKPACK_NOT_FOUND /
 * BIOME_LOCKED / PREVIOUS_BIOME_REQUIRED / PREVIOUS_TIER_REQUIRED /
 * INSUFFICIENT_BALANCE.
 */
export async function buyBackpack(
    client: Client,
    userId: string,
    backpackId: string,
    session: ClientSession,
) {
    const def = getBackpack(client, backpackId);
    if (!def) throw new Error('BACKPACK_NOT_FOUND');

    const user = await getUser(userId, session);
    if (!user) throw new Error('USER_NOT_FOUND');

    assertBiomeUnlocked(client, user, def.biome);

    if (def.tier > 1) {
        const previousTierId = getBackpacksForBiome(client, def.biome).find(
            (b) => b.tier === def.tier - 1,
        )?.id;
        if (previousTierId && !isBackpackOwned(user, previousTierId)) {
            throw new Error('PREVIOUS_TIER_REQUIRED');
        }
    }

    if (isBackpackOwned(user, backpackId)) {
        throw new Error('ALREADY_OWNED');
    }

    if (user.balance < def.price) {
        throw new Error('INSUFFICIENT_BALANCE');
    }

    await updateBalance(userId, -def.price, session);

    const fresh = await getUser(userId, session);
    if (!fresh) throw new Error('USER_NOT_FOUND');

    fresh.backpacks.push({
        backpackId: def.id,
        biome: def.biome,
        tier: def.tier,
    } as OwnedBackpack);

    fresh.equippedBackpack = def.id;
    await fresh.save({ session });
    return fresh;
}
