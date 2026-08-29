import type { Client } from "discord.js";

import {
    validateMining,
} from "./MiningValidator";

import {
    getBiomeOres,
    rollOres,
} from "./OreService";

import {
    calculateMiningAmount,
} from "./EffectiveService";

import {
    calculateOreXp,
} from "./XpService";

import {
    rollChest,
} from "./ChestService";

import {
    getUpgradeStats,
} from "../upgrade/UpgradeService";

import {
    addItems,
} from "../inventory/InventoryService";

import {
    addXp,
    type LevelUpResult,
} from "../level/LevelService";

import User from "../../models/User";

import type { Ore } from "../../types/Ore";
import type { Biome } from "../../types/Biome";
import type { Pickaxe } from "../../types/Pickaxe";
import type { ChestResult } from "./ChestService";
import { addHistoryItems } from "../history/HistoryService";

export type MiningFailure =
    | {
        success: false;
        reason: "RESOURCE_NOT_FOUND";
    }
    | {
        success: false;
        reason: "PICKAXE_TOO_WEAK";
        biome: Biome;
        pickaxe: Pickaxe;
        minimumPickaxe?: Pickaxe;
    }
    | {
        success: false;
        reason: "NO_ORE";
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

    totalXp: number;

    levelUp: LevelUpResult | null;
}

export type MiningResult =
    | MiningFailure
    | MiningSuccess;

export async function mine(
    client: Client,
    user: any,
): Promise<MiningResult> {

    // Validate

    const validation =
        validateMining(
            client,
            user.pickaxe,
            user.biome,
        );

    if (!validation.success) {
        return validation;
    }

    const {
        biome,
        pickaxe,
    } = validation;

    // Cur level

    const currentLevel =
        Math.max(
            1,
            user.level ?? 1,
        );

    // Upgrade stats

    const stats =
        getUpgradeStats(user);

    // Get ores

    const ores =
        getBiomeOres(
            client,
            biome.id,
        );

    if (ores.length === 0) {
        return {
            success: false,
            reason: "NO_ORE",
        };
    }

    // Calc mining amount

    const miningAmount =
        calculateMiningAmount(
            stats.effective,
        );

    // Roll ores

    const minedOres =
        rollOres(
            ores,
            miningAmount,
            stats.fortune,
        );

    if (minedOres.length === 0) {
        return {
            success: false,
            reason: "NO_ORE",
        };
    }

    // Group ores

    const oreMap =
        new Map<
            string,
            {
                ore: Ore;
                amount: number;
            }
        >();

    for (const ore of minedOres) {
        const existing =
            oreMap.get(ore.id);

        if (existing) {
            existing.amount++;
        } else {
            oreMap.set(
                ore.id,
                {
                    ore,
                    amount: 1,
                },
            );
        }
    }

    // Calc XP

    const results:
        MiningOreResult[] = [];

    let miningXp = 0;

    for (const {
        ore,
        amount,
    } of oreMap.values()) {

        const xp =
            calculateOreXp(
                ore,
                amount,
                stats.xp_multiplier,
            );

        results.push({
            ore,
            amount,
            xp,
        });

        miningXp += xp;
    }

    // Add ores

    await addItems(
        user.userId,
        results.map(
            ({
                ore,
                amount,
            }) => ({
                itemId: ore.id,
                quantity: amount,
            }),
        ),
    );

    // Add history

    await addHistoryItems(
        user.id,
        results.map(
            ({
                ore, amount
            }) => ({
                itemId: ore.id,
                quantity: amount
            })
        )
    )

    // Chest
    // Chest dùng level TRƯỚC khi nhận XP.

    const chest =
        rollChest(
            stats.chest_chance,
            stats.chest_quality,
            currentLevel,
        );

    // Chest money

    if (chest.opened && chest.money > 0) {
        await User.updateOne(
            {
                userId:
                    user.userId,
            },
            {
                $inc: {
                    balance:
                        chest.money,
                },
            },
        );
    }

    // Total XP

    const totalXp =
        miningXp +
        (
            chest.opened
                ? chest.xp
                : 0
        );

    // Add XP + Level Up

    const levelUp =
        await addXp(
            user.userId,
            totalXp,
        );

    // Return

    return {
        success: true,

        biome,
        pickaxe,

        ores: results,

        miningXp,

        chest,

        totalXp,

        levelUp,
    };
}