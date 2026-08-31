import mongoose from 'mongoose';
import type { Client } from 'discord.js';

import { validateMining } from './MiningValidator';
import { getBiomeOres, rollOres } from './OreService';
import { calculateMiningAmount } from './EffectiveService';
import { calculateOreXp } from './XpService';
import { rollChest } from './ChestService';
import { getUpgradeStats, type UpgradeStats } from '../upgrade/UpgradeService';
import {
    getActiveBoosts,
    getBoostByGroup,
} from '../shop/BoostShopService';

import { addItems } from '../inventory/InventoryService';

import { addMiningStats } from '../history/HistoryService';

import { addXp, type LevelUpResult } from '../level/LevelService';

import { getPetBonusStats } from '../pet/PetStatService';
import { addPetXp, type PetLevelUpResult } from '../pet/PetService';
import { rollPetReward } from '../pet/PetRewardService';
import type { PetDropResult } from '../../types/Pet';

import type { Ore } from '../../types/Ore';
import type { Biome } from '../../types/Biome';
import type { Pickaxe } from '../../types/Pickaxe';
import type { ChestResult } from './ChestService';
import { updateBalance, updateGems, addPet } from '../user/UserService';

function getBiomeTier(client: Client, biomeId: string): number {
    const ordered = [...client.resources.biomes.values()].sort(
        (a, b) => a.unlock_level - b.unlock_level,
    );

    return ordered.findIndex((b) => b.id === biomeId);
}

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

    gems: number;

    totalXp: number;

    levelUp: LevelUpResult | null;

    petLevelUp: PetLevelUpResult | null;

    petDrop: PetDropResult | null;
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
    const activeBoosts = getActiveBoosts(user);

    const petBonuses = getPetBonusStats(client, user);

    for (const stat of EXTRA_MINING_STATS) {
        const buffVal = pickaxe.buff?.[stat] ?? 0;

        let boostBonus = 0;

        for (const active of activeBoosts) {
            const boost = getBoostByGroup(client, active.boostId);

            if (boost && boost.stat === stat) {
                boostBonus += boost.multiplier - 1;
            }
        }

        const petBonus = petBonuses[stat] ?? 0;

        stats[stat] *= 1 + buffVal + boostBonus + petBonus;
    }
}

export async function mine(client: Client, user: any): Promise<MiningResult> {
    // Validate
    const validation = validateMining(client, user.pickaxe, user.biome);

    if (!validation.success) {
        return validation;
    }

    const { biome, pickaxe } = validation;

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
    const chest = rollChest(
        stats.chest_chance,
        stats.chest_quality,
        biomeTier,
    );

    const totalXp = miningXp + (chest.opened ? chest.xp : 0);

    // Pet drop (only when chest opens, roll separately)
    let petDrop: PetDropResult | null = null;

    if (chest.opened) {
        petDrop = rollPetReward(client, user);
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

            // Chest money
            if (chest.opened && chest.money > 0) {
                await updateBalance(user.userId, chest.money, session);
            }

            // Chest gems
            if (chest.opened && chest.gems > 0) {
                await updateGems(user.userId, chest.gems, session);
            }

            // Xp + level up
            levelUp = await addXp(user.userId, totalXp, session);

            // Pet XP (only equipped pet)
            if (user.equippedPet && miningXp > 0) {
                petLevelUp = await addPetXp(user.userId, miningXp, session);
            }

            // Pet drop from chest
            if (petDrop) {
                await addPet(user.userId, petDrop.petId, session);
            }
        });

        return {
            success: true,

            biome,
            pickaxe,

            ores: results,

            miningXp,

            chest,

            gems: chest.gems,

            totalXp,

            levelUp,

            petLevelUp,

            petDrop,
        };
    } finally {
        await session.endSession();
    }
}
