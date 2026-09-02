import {
    CHEST_MONEY_BY_TIER,
    CHEST_XP_BY_TIER,
    CHEST_MIN_REWARD_MULTIPLIER,
    CHEST_MAX_REWARD_MULTIPLIER,
    CHEST_BASE_CHANCE,
    CHEST_MAX_CHANCE,
} from '../../config/BalanceConfig';
import { rollChance } from '../../shared/utils/random';

export interface ChestResult {
    opened: boolean;
    reward_type: 'money' | 'xp' | 'gems';
    money: number;
    xp: number;
    gems: number;
    petChanceRolled: boolean;
}

function rollChestChance(chestChance: number): boolean {
    const safeChance = Math.max(0, Math.min(CHEST_MAX_CHANCE, chestChance));
    return rollChance(safeChance);
}

function rollRewardMultiplier(): number {
    return (
        CHEST_MIN_REWARD_MULTIPLIER +
        Math.random() *
            (CHEST_MAX_REWARD_MULTIPLIER - CHEST_MIN_REWARD_MULTIPLIER)
    );
}

function getTierValue(values: number[], tier: number): number {
    const safeTier = Math.max(0, Math.min(values.length - 1, tier));
    return values[safeTier]!;
}

function calculateMoneyReward(tier: number, quality: number): number {
    const base = getTierValue(CHEST_MONEY_BY_TIER, tier);
    const qualityMultiplier = Math.max(1, quality);
    return Math.max(
        1,
        Math.floor(base * qualityMultiplier * rollRewardMultiplier()),
    );
}

function calculateXpReward(tier: number, quality: number): number {
    const base = getTierValue(CHEST_XP_BY_TIER, tier);
    const qualityMultiplier = Math.max(1, quality);
    return Math.max(
        1,
        Math.floor(base * qualityMultiplier * rollRewardMultiplier()),
    );
}

function calculateGemReward(quality: number): number {
    const base = 1 + Math.floor(quality * Math.random() * 2);
    return Math.min(3, Math.max(1, base));
}

function rollRewardType(): 'money' | 'xp' | 'gems' {
    const roll = Math.random() * 100;

    if (roll < 40) return 'money';
    if (roll < 80) return 'xp';
    return 'gems';
}

/**
 * @param chestChance base chance (0-100), already including upgrade multiplier
 * @param chestQuality quality multiplier
 * @param biomeTier the tier of the biome being mined (0..4)
 * @param chestUpgradeMultiplier multiplier from the chest_chance upgrade
 */
export function rollChest(
    chestChance: number,
    chestQuality: number,
    biomeTier: number,
    chestUpgradeMultiplier = 1,
): ChestResult {
    const effectiveChance = Math.max(
        CHEST_BASE_CHANCE,
        chestChance * chestUpgradeMultiplier,
    );

    const opened = rollChestChance(effectiveChance);

    if (!opened) {
        return {
            opened: false,
            reward_type: 'money',
            money: 0,
            xp: 0,
            gems: 0,
            petChanceRolled: false,
        };
    }

    const type = rollRewardType();

    return {
        opened: true,
        reward_type: type,
        money:
            type === 'money'
                ? calculateMoneyReward(biomeTier, chestQuality)
                : 0,
        xp: type === 'xp' ? calculateXpReward(biomeTier, chestQuality) : 0,
        gems: type === 'gems' ? calculateGemReward(chestQuality) : 0,
        petChanceRolled: true,
    };
}
