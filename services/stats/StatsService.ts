import type { Client } from 'discord.js';

import { getUpgradeStats } from '../upgrade/UpgradeService';
import { getActiveBoosts, getBoostByGroup } from '../shop/BoostShopService';
import { getPetBonusStats } from '../pet/PetStatService';
import { getCharmStatBonus } from '../charm/CharmService';
import {
    EMOJI_PICKAXE,
    EMOJI_FORTUNE,
    EMOJI_XP,
    EMOJI_CHEST,
    EMOJI_MONEY,
    EMOJI_GOLD_INGOT,
} from '../emoji/EmojiService';

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

export function getPlayerMultipliers(
    client: Client,
    user: any,
): MultiplierInfo[] {
    const stats = getUpgradeStats(user);

    const pickaxe = client.resources.pickaxes.get(user.pickaxe);

    const activeBoosts = getActiveBoosts(user);

    const petBonuses = getPetBonusStats(client, user);

    const charmBonuses = getCharmStatBonus(client, user);

    const result: MultiplierInfo[] = [];

    for (const def of STACKED_STATS) {
        const base = stats[def.stat];
        const pickaxeBonus = pickaxe?.buff?.[def.stat] ?? 0;

        let boostBonus = 0;

        for (const active of activeBoosts) {
            const boost = getBoostByGroup(client, active.boostId);

            if (boost && boost.stat === def.stat) {
                boostBonus += boost.multiplier - 1;
            }
        }

        const petBonus = petBonuses[def.stat] ?? 0;

        const charmBonus = charmBonuses[def.stat] ?? 0;

        result.push({
            stat: def.stat,
            name: def.name,
            emoji: def.emoji,
            base,
            pickaxeBonus,
            boostBonus,
            petBonus,
            charmBonus,
            total:
                base * (1 + pickaxeBonus + boostBonus + petBonus + charmBonus),
        });
    }

    const sellBase = stats.sell_price;
    const sellBuff = pickaxe?.buff?.sell_price ?? 0;
    const sellPetBonus = petBonuses.sell_price ?? 0;
    const sellCharmBonus = charmBonuses.sell_price ?? 0;

    result.push({
        stat: SELL_DEF.stat,
        name: SELL_DEF.name,
        emoji: SELL_DEF.emoji,
        base: sellBase,
        pickaxeBonus: sellBuff,
        boostBonus: 0,
        petBonus: sellPetBonus,
        charmBonus: sellCharmBonus,
        total: sellBase * (1 + sellBuff + sellPetBonus + sellCharmBonus),
    });

    return result;
}
