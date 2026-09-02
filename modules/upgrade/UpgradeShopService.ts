import { PRIMARY_UPGRADE, CHEST_UPGRADE } from '../../config/BalanceConfig';
import {
    EMOJI_PICKAXE,
    EMOJI_FORTUNE,
    EMOJI_MONEY,
    EMOJI_XP,
    EMOJI_CHEST,
    EMOJI_GOLD_INGOT,
} from '../../shared/emoji/EmojiService';

export interface UpgradeDef {
    id: string;
    name: string;
    description: string;
    emoji: string;
    stat:
        | 'effective'
        | 'fortune'
        | 'sell_price'
        | 'xp_multiplier'
        | 'chest_chance'
        | 'chest_quality';
    baseCost: number;
    growth: number;
    maxLevel: number;
}

export const UPGRADE_DEFS: UpgradeDef[] = [
    {
        id: 'effective',
        name: 'Hiệu quả',
        description: 'Tăng số lượng quặng khai thác mỗi lần đào.',
        emoji: EMOJI_PICKAXE,
        stat: 'effective',
        baseCost: PRIMARY_UPGRADE.baseCost,
        growth: PRIMARY_UPGRADE.growth,
        maxLevel: PRIMARY_UPGRADE.maxLevel,
    },
    {
        id: 'fortune',
        name: 'May mắn',
        description: 'Tăng tỷ lệ rơi quặng hiếm.',
        emoji: EMOJI_FORTUNE,
        stat: 'fortune',
        baseCost: PRIMARY_UPGRADE.baseCost,
        growth: PRIMARY_UPGRADE.growth,
        maxLevel: PRIMARY_UPGRADE.maxLevel,
    },
    {
        id: 'sell_price',
        name: 'Giá bán',
        description: 'Tăng giá bán khoáng sản.',
        emoji: EMOJI_MONEY,
        stat: 'sell_price',
        baseCost: PRIMARY_UPGRADE.baseCost,
        growth: PRIMARY_UPGRADE.growth,
        maxLevel: PRIMARY_UPGRADE.maxLevel,
    },
    {
        id: 'xp_multiplier',
        name: 'Nhân XP',
        description: 'Tăng kinh nghiệm nhận được khi khai thác.',
        emoji: EMOJI_XP,
        stat: 'xp_multiplier',
        baseCost: PRIMARY_UPGRADE.baseCost,
        growth: PRIMARY_UPGRADE.growth,
        maxLevel: PRIMARY_UPGRADE.maxLevel,
    },
    {
        id: 'chest_chance',
        name: 'Tỷ lệ rương',
        description: 'Tăng tỷ lệ tìm thấy rương kho báu.',
        emoji: EMOJI_CHEST,
        stat: 'chest_chance',
        baseCost: CHEST_UPGRADE.baseCost,
        growth: CHEST_UPGRADE.growth,
        maxLevel: CHEST_UPGRADE.maxLevel,
    },
    {
        id: 'chest_quality',
        name: 'Chất lượng rương',
        description: 'Tăng chất lượng phần thưởng từ rương kho báu.',
        emoji: EMOJI_GOLD_INGOT,
        stat: 'chest_quality',
        baseCost: CHEST_UPGRADE.baseCost,
        growth: CHEST_UPGRADE.growth,
        maxLevel: CHEST_UPGRADE.maxLevel,
    },
];

export function getUpgradeCost(def: UpgradeDef, currentLevel: number): number {
    return Math.floor(def.baseCost * Math.pow(def.growth, currentLevel));
}

export function getUpgradeProgress(user: any, def: UpgradeDef): number {
    return Math.max(0, Math.min(def.maxLevel, user.upgrades?.[def.stat] ?? 0));
}

export function isUpgradeMaxed(user: any, def: UpgradeDef): boolean {
    return getUpgradeProgress(user, def) >= def.maxLevel;
}

export const UPGRADES_PER_PAGE = 5;

export function getUpgradePage(user: any, page: number) {
    const totalPages = Math.max(
        1,
        Math.ceil(UPGRADE_DEFS.length / UPGRADES_PER_PAGE),
    );

    const currentPage = Math.max(0, Math.min(page, totalPages - 1));

    const start = currentPage * UPGRADES_PER_PAGE;

    const items = UPGRADE_DEFS.slice(start, start + UPGRADES_PER_PAGE).map(
        (def) => ({
            def,
            currentLevel: getUpgradeProgress(user, def),
            nextCost: getUpgradeCost(def, getUpgradeProgress(user, def)),
            maxed: isUpgradeMaxed(user, def),
        }),
    );

    return {
        items,
        page: currentPage,
        totalPages,
    };
}
