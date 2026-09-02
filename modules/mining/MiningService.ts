import mongoose from 'mongoose';
import type { Client, TextBasedChannel, ColorResolvable } from 'discord.js';

import { validateMining } from './MiningValidator';
import { getBiomeTier } from './getBiomeTier';
import { getBiomeOres, rollOres } from './OreService';
import { calculateMiningAmount } from './EffectiveService';
import { calculateOreXp } from './XpService';
import { rollChest } from '../chest/ChestService';
import { getUpgradeStats, type UpgradeStats } from '../upgrade/UpgradeService';

import { addItems } from '../inventory/InventoryService';

import { addMiningStats } from '../history/HistoryService';

import { addXp, type LevelUpResult } from '../progression/ProgressionService';

import { addPet, addPetXp, type PetLevelUpResult } from '../pet/PetService';
import { rollPetReward } from '../pet/PetRewardService';
import type { PetDropResult } from '../../types/Pet';

import { addCharmCopies } from '../charm/CharmService';
import { rollCharmReward } from '../charm/CharmRewardService';
import type { CharmDropResult } from '../../types/Charm';

import type { Ore } from '../../types/Ore';
import type { Biome } from '../../types/Biome';
import type { Pickaxe } from '../../types/Pickaxe';
import type { ChestResult } from '../chest/ChestService';
import { updateBalance, updateGems } from '../economy/BalanceService';
import type { TrapOutcome } from '../chest/ChestTrapService';
import { resolveChest } from '../chest/ChestTrapService';
import {
    isStunned,
    getStunRemainingMs,
    getMiningSlowModifier,
    setLastMineAt,
} from '../chest/TrapService';
import { calcFinalCooldown } from '../equipment/BackpackShopService';
import { PET_MINING_XP_MULTIPLIER } from '../../config/BalanceConfig';
import { applyStatMultipliers } from '../stats/StatsService';
import {
    updateQuestProgress,
    type QuestProgressUpdate,
} from '../quest/QuestService';
import { sendQuestCompletedNotice } from '../quest/QuestRenderer';

export type MiningFailure =
    | {
          success: false;
          reason: 'RESOURCE_NOT_FOUND';
      }
    | {
          success: false;
          reason: 'PICKAXE_TOO_WEAK';
          biome: Biome;
          pickaxe: Pickaxe;
          minimumPickaxe?: Pickaxe;
      }
    | {
          success: false;
          reason: 'NO_ORE';
      }
    | {
          success: false;
          reason: 'STUNNED';
          remainingMs: number;
      }
    | {
          success: false;
          reason: 'MINING_COOLDOWN';
          remainingMs: number;
      };

export interface MiningOreResult {
    ore: Ore;
    amount: number;
    xp: number;
}

export interface MiningSuccess {
    success: true;

    biome: Biome;
    pickaxe: Pickaxe;

    ores: MiningOreResult[];

    miningXp: number;

    chest: ChestResult;

    trap: TrapOutcome | null;

    gems: number;

    totalXp: number;

    levelUp: LevelUpResult | null;

    petLevelUp: PetLevelUpResult | null;

    petDrop: PetDropResult | null;

    charmDrop: CharmDropResult | null;
}

export type MiningResult = MiningFailure | MiningSuccess;

const EXTRA_MINING_STATS = [
    'effective',
    'fortune',
    'xp_multiplier',
    'chest_chance',
    'chest_quality',
] as const;

function applyExtraStats(
    client: Client,
    user: any,
    pickaxe: Pickaxe,
    stats: UpgradeStats,
) {
    applyStatMultipliers(client, user, pickaxe, stats, EXTRA_MINING_STATS);
}

export async function mine(
    client: Client,
    user: any,
    channel?: TextBasedChannel | null,
): Promise<MiningResult> {
    // Validate
    const validation = validateMining(client, user.pickaxe, user.biome);

    if (!validation.success) {
        return validation;
    }

    const { biome, pickaxe } = validation;

    // Stun check — a stunned player cannot mine at all.
    if (isStunned(user)) {
        return {
            success: false,
            reason: 'STUNNED',
            remainingMs: getStunRemainingMs(user),
        };
    }

    // Mining cooldown (centralized: biome base - backpack reduction, floored,
    // then multiplied by any Mining Slow; built on the trap system).
    const slowModifier = getMiningSlowModifier(user);
    const effectiveCooldown = calcFinalCooldown(
        client,
        user,
        biome.id,
        slowModifier,
    );
    if (user.lastMineAt) {
        const elapsed = Date.now() - new Date(user.lastMineAt).getTime();
        if (elapsed < effectiveCooldown * 1000) {
            return {
                success: false,
                reason: 'MINING_COOLDOWN',
                remainingMs: Math.ceil(effectiveCooldown * 1000 - elapsed),
            };
        }
    }

    // Biome tier (0 = plains .. 4 = abyss)
    const biomeTier = getBiomeTier(client, biome.id);

    // Upgrade stats
    const stats = getUpgradeStats(user);

    // Pickaxe buff + active boost (additive onto base, then upgrade multiplier)
    applyExtraStats(client, user, pickaxe, stats);

    // Get ores
    const ores = getBiomeOres(client, biome.id);

    if (ores.length === 0) {
        return {
            success: false,
            reason: 'NO_ORE',
        };
    }

    // Mining amount
    const miningAmount = calculateMiningAmount(stats.effective);

    // Roll ores
    const minedOres = rollOres(ores, miningAmount, stats.fortune);

    if (minedOres.length === 0) {
        return {
            success: false,
            reason: 'NO_ORE',
        };
    }

    // Group ores
    const oreMap = new Map<
        string,
        {
            ore: Ore;
            amount: number;
        }
    >();

    for (const ore of minedOres) {
        const existing = oreMap.get(ore.id);

        if (existing) {
            existing.amount++;
        } else {
            oreMap.set(ore.id, {
                ore,
                amount: 1,
            });
        }
    }

    // Calculate XP
    const results: MiningOreResult[] = [];

    let miningXp = 0;

    for (const { ore, amount } of oreMap.values()) {
        const xp = calculateOreXp(ore, amount, stats.xp_multiplier);

        results.push({
            ore,
            amount,
            xp,
        });

        miningXp += xp;
    }

    // Chest
    const chest = rollChest(stats.chest_chance, stats.chest_quality, biomeTier);

    // Actual chest outcome (normal / trapped trap) is resolved inside the
    // transaction so trap persistence and any ore removal are atomic.
    let trap: TrapOutcome | null = null;
    let grantedChest = false;
    let totalXp = miningXp;

    // Pet drop (only when chest opens, roll separately)
    let petDrop: PetDropResult | null = null;

    if (chest.opened) {
        petDrop = rollPetReward(client, user);
    }

    // Charm drop (only when chest opens, roll separately)
    let charmDrop: CharmDropResult | null = null;

    if (chest.opened) {
        charmDrop = rollCharmReward(client, user);
    }

    /*
     * ==========================================
     * DATABASE TRANSACTION
     * ==========================================
     */

    const session = await mongoose.startSession();

    let levelUp: LevelUpResult | null = null;
    let petLevelUp: PetLevelUpResult | null = null;

    try {
        await session.withTransaction(async () => {
            // Add ores
            await addItems(
                user.userId,
                results.map(({ ore, amount }) => ({
                    itemId: ore.id,
                    quantity: amount,
                })),
                session,
            );

            //Add history
            await addMiningStats(
                user.userId,
                results.map(({ ore, amount }) => ({
                    itemId: ore.id,
                    quantity: amount,
                })),
                session,
            );

            // Resolve chest (normal vs trapped). Only grants checks below when
            // the chest is truly a normal (or immunity-prevented) chest.
            if (chest.opened) {
                trap = await resolveChest(
                    client,
                    user.userId,
                    user.level,
                    session,
                );

                grantedChest = trap.kind === 'normal';
                totalXp = miningXp + (grantedChest ? chest.xp : 0);
            }

            // Chest money
            if (grantedChest && chest.money > 0) {
                await updateBalance(user.userId, chest.money, session);
            }

            // Chest gems
            if (grantedChest && chest.gems > 0) {
                await updateGems(user.userId, chest.gems, session);
            }

            // Xp + level up
            levelUp = await addXp(user.userId, totalXp, session);

            // Record the mine time for cooldown bookkeeping.
            await setLastMineAt(user.userId, session);

            // Pet XP — only the equipped pet, as a fraction of the player's
            // mining XP (see PET_MINING_XP_MULTIPLIER).
            const petXp = Math.floor(miningXp * PET_MINING_XP_MULTIPLIER);

            if (user.equippedPet && petXp > 0) {
                petLevelUp = await addPetXp(user.userId, petXp, session);
            }

            // Pet drop from chest
            if (petDrop) {
                await addPet(user.userId, petDrop.petId, session);
            }

            // Charm drop from chest
            if (charmDrop) {
                await addCharmCopies(
                    client,
                    user.userId,
                    charmDrop.charmId,
                    1,
                    session,
                );
            }

            // Daily quest progress (batched inside the mining transaction)
            const questUpdates: QuestProgressUpdate[] = [
                { type: 'mine', amount: 1 },
                {
                    type: 'collect_ores',
                    amount: results.reduce((sum, r) => sum + r.amount, 0),
                },
            ];

            if (grantedChest) {
                questUpdates.push({ type: 'open_chests', amount: 1 });

                if (chest.money > 0) {
                    questUpdates.push({
                        type: 'earn_money',
                        amount: chest.money,
                    });
                }
            }

            if (levelUp && levelUp.levelsGained > 0) {
                questUpdates.push({
                    type: 'level_up',
                    amount: levelUp.levelsGained,
                });
            }

            const questResult = await updateQuestProgress(
                client,
                user.userId,
                questUpdates,
                session,
            );

            if (questResult && questResult.notices.length > 0) {
                await sendQuestCompletedNotice(
                    client,
                    channel,
                    user.userId,
                    questResult.notices,
                    user.color as ColorResolvable,
                );
            }
        });

        return {
            success: true,

            biome,
            pickaxe,

            ores: results,

            miningXp,

            chest,

            trap,

            gems: grantedChest ? chest.gems : 0,

            totalXp,

            levelUp,

            petLevelUp,

            petDrop,

            charmDrop,
        };
    } finally {
        await session.endSession();
    }
}
