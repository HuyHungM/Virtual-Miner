import type { Client } from 'discord.js';

import { getUpgradeStats, type UpgradeStats } from '../upgrade/UpgradeService';
import { getActiveBoosts, getBoostByGroup } from '../boost/BoostShopService';
import { getPetBonusStats } from '../pet/PetStatService';
import { getCharmStatBonus } from '../charm/CharmService';
import type { Pickaxe } from '../../types/Pickaxe';
import {
    EMOJI_PICKAXE,
    EMOJI_FORTUNE,
    EMOJI_XP,
    EMOJI_CHEST,
    EMOJI_MONEY,
    EMOJI_GOLD_INGOT,
} from '../../shared/emoji/EmojiService';

interface StatDef {
    stat: keyof ReturnType<typeof getUpgradeStats>;
    name: string;
    emoji: string;
}

const STACKED_STATS: StatDef[] = [
    { stat: 'effective', name: 'Hiệu quả', emoji: EMOJI_PICKAXE },
    { stat: 'fortune', name: 'May mắn', emoji: EMOJI_FORTUNE },
    { stat: 'xp_multiplier', name: 'Nhân XP', emoji: EMOJI_XP },
    { stat: 'chest_chance', name: 'Tỷ lệ rương', emoji: EMOJI_CHEST },
    {
        stat: 'chest_quality',
        name: 'Chất lượng rương',
        emoji: EMOJI_GOLD_INGOT,
    },
];

// sell_price has no boost resource; only the pickaxe buff applies on top of
// the upgrade multiplier (matches the sell command's formula).
const SELL_DEF: StatDef = {
    stat: 'sell_price',
    name: 'Giá bán',
    emoji: EMOJI_MONEY,
};

export interface MultiplierInfo {
    stat: string;
    name: string;
    emoji: string;
    /** Multiplier from upgrade levels (e.g. 1.75). */
    base: number;
    /** Additive bonus from the pickaxe buff (0 when none). */
    pickaxeBonus: number;
    /** Additive bonus from active boosts (0 when none). */
    boostBonus: number;
    /** Additive bonus from equipped pet (0 when none). */
    petBonus: number;
    /** Additive bonus from owned charms (0 when none). */
    charmBonus: number;
    /** Combined total multiplier: base * (1 + pickaxeBonus + boostBonus + petBonus + charmBonus). */
    total: number;
}

export interface StatMultipliers {
    /** Additive bonus from the pickaxe buff (0 when none). */
    pickaxeBonus: number;
    /** Additive bonus from active boosts (0 when none). */
    boostBonus: number;
    /** Additive bonus from equipped pet (0 when none). */
    petBonus: number;
    /** Additive bonus from owned charms (0 when none). */
    charmBonus: number;
    /** Multiplicative factor: 1 + pickaxeBonus + boostBonus + petBonus + charmBonus. */
    factor: number;
}

/**
 * Single source of truth for the final per-stat aggregation formula:
 *   base * (1 + pickaxeBonus + boostBonus + petBonus + charmBonus)
 * Shared by the mining pipeline and the profile/stats display so both stay in
 * sync. When `skipBoost` is set, active boosts are ignored (e.g. sell price,
 * which has no boost resource).
 */
export function computeStatMultipliers(
    client: Client,
    user: any,
    pickaxe: Pickaxe | undefined,
    stat: keyof UpgradeStats,
    skipBoost = false,
): StatMultipliers {
    const pickaxeBonus = pickaxe?.buff?.[stat] ?? 0;

    let boostBonus = 0;

    if (!skipBoost) {
        for (const active of getActiveBoosts(user)) {
            const boost = getBoostByGroup(client, active.boostId);

            if (boost && boost.stat === stat) {
                boostBonus += boost.multiplier - 1;
            }
        }
    }

    const petBonus = getPetBonusStats(client, user)[stat] ?? 0;

    const charmBonus = getCharmStatBonus(client, user)[stat] ?? 0;

    return {
        pickaxeBonus,
        boostBonus,
        petBonus,
        charmBonus,
        factor: 1 + pickaxeBonus + boostBonus + petBonus + charmBonus,
    };
}

/**
 * Applies the final aggregation formula in-place to the given stats for the
 * listed stat keys, leaving every other stat untouched.
 */
export function applyStatMultipliers(
    client: Client,
    user: any,
    pickaxe: Pickaxe | undefined,
    stats: UpgradeStats,
    statList: readonly (keyof UpgradeStats)[],
    skipBoost = false,
): void {
    for (const stat of statList) {
        const { factor } = computeStatMultipliers(
            client,
            user,
            pickaxe,
            stat,
            skipBoost,
        );

        stats[stat] *= factor;
    }
}

export function getPlayerMultipliers(
    client: Client,
    user: any,
): MultiplierInfo[] {
    const stats = getUpgradeStats(user);

    const pickaxe = client.resources.pickaxes.get(user.pickaxe);

    const result: MultiplierInfo[] = [];

    for (const def of STACKED_STATS) {
        const base = stats[def.stat];

        const m = computeStatMultipliers(client, user, pickaxe, def.stat);

        result.push({
            stat: def.stat,
            name: def.name,
            emoji: def.emoji,
            base,
            pickaxeBonus: m.pickaxeBonus,
            boostBonus: m.boostBonus,
            petBonus: m.petBonus,
            charmBonus: m.charmBonus,
            total: base * m.factor,
        });
    }

    const sellBase = stats.sell_price;

    const m = computeStatMultipliers(client, user, pickaxe, 'sell_price', true);

    result.push({
        stat: SELL_DEF.stat,
        name: SELL_DEF.name,
        emoji: SELL_DEF.emoji,
        base: sellBase,
        pickaxeBonus: m.pickaxeBonus,
        boostBonus: 0,
        petBonus: m.petBonus,
        charmBonus: m.charmBonus,
        total: sellBase * m.factor,
    });

    return result;
}
