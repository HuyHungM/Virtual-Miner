import mongoose, { type ClientSession } from 'mongoose';
import {
    ContainerBuilder,
    MessageFlags,
    resolveColor,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type Client,
    type ColorResolvable,
    type TextBasedChannel,
} from 'discord.js';

import {
    QUEST_COUNT,
    QUEST_REWARD_CHANCES,
    QUEST_MONEY_SCALE,
    QUEST_XP_FRACTION,
    QUEST_GEM,
    QUEST_REQUIREMENT_POINTS,
    type CurvePoint,
} from '../balance/BalanceConfig';
import { getDailyMoneyReward } from '../daily/DailyRewardService';
import {
    addXp,
    getRequiredXp,
    interpolate,
    type LevelUpResult,
} from '../level/LevelService';
import {
    getUser,
    updateBalance,
    updateGems,
    updateQuests,
} from '../user/UserService';
import { addCharmCopies, getDailyCharmReward } from '../charm/CharmService';

import {
    EMOJI_PICKAXE,
    EMOJI_ENDERCHEST,
    EMOJI_LEVEL_UP,
    EMOJI_CHEST,
    EMOJI_MONEY,
    EMOJI_QUEST,
    EMOJI_GIFT,
    EMOJI_XP,
    EMOJI_GEM,
    getEmoji,
} from '../emoji/EmojiService';

export type QuestType =
    'mine' | 'collect_ores' | 'level_up' | 'open_chests' | 'earn_money';

export type QuestRewardCategory = 'money' | 'xp' | 'charm' | 'gem';

export interface QuestDef {
    type: QuestType;
    label: string;
    unit?: string;
    money?: boolean;
    emoji: string;
    points: CurvePoint[];
}

export interface DailyQuest {
    questId: string;
    type: string;
    requirement: number;
    progress: number;
    completed: boolean;
    claimed: boolean;
}

export interface QuestProgressUpdate {
    type: QuestType;
    amount: number;
}

/**
 * Centralized quest pool. Adding a new quest type later = one definition here
 * plus a matching `QUEST_REQUIREMENT_POINTS` row in BalanceConfig.
 */
export const QUEST_POOL: QuestDef[] = [
    {
        type: 'mine',
        label: 'Đào mỏ',
        unit: 'lần',
        emoji: EMOJI_PICKAXE,
        points: QUEST_REQUIREMENT_POINTS.mine,
    },
    {
        type: 'collect_ores',
        label: 'Thu thập',
        unit: 'quặng',
        emoji: EMOJI_ENDERCHEST,
        points: QUEST_REQUIREMENT_POINTS.collect_ores,
    },
    {
        type: 'level_up',
        label: 'Lên cấp',
        unit: 'lần',
        emoji: EMOJI_LEVEL_UP,
        points: QUEST_REQUIREMENT_POINTS.level_up,
    },
    {
        type: 'open_chests',
        label: 'Mở rương',
        unit: 'lần',
        emoji: EMOJI_CHEST,
        points: QUEST_REQUIREMENT_POINTS.open_chests,
    },
    {
        type: 'earn_money',
        label: 'Kiếm',
        money: true,
        emoji: EMOJI_MONEY,
        points: QUEST_REQUIREMENT_POINTS.earn_money,
    },
];

export function getQuestDef(type: QuestType): QuestDef | undefined {
    return QUEST_POOL.find((def) => def.type === type);
}

/** Human-readable quest goal, e.g. "Đào mỏ 5.000 lần" or "Kiếm $5.000". */
export function formatQuestGoal(quest: DailyQuest): string {
    const def = getQuestDef(quest.type as any);

    if (!def) return quest.questId;

    if (def.money) {
        return `${def.label} $${quest.requirement.toLocaleString()}`;
    }

    return `${def.label} ${quest.requirement.toLocaleString()} ${def.unit}`;
}

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        const tmp = copy[i]!;
        copy[i] = copy[j]!;
        copy[j] = tmp;
    }

    return copy;
}

/**
 * Randomly picks exactly QUEST_COUNT distinct quest types and scales each
 * requirement by the player's level using the configured curve anchors.
 */
export function generateDailyQuests(level: number): DailyQuest[] {
    const safeLevel = Math.max(1, level);

    const selected = shuffle(QUEST_POOL).slice(0, QUEST_COUNT);

    return selected.map((def) => ({
        questId: def.type,
        type: def.type,
        requirement: Math.max(1, interpolate(def.points, safeLevel)),
        progress: 0,
        completed: false,
        claimed: false,
    }));
}

// ============================================
// DAILY RESET
// ============================================

/** Server-local day key — quests reset exactly at server-local midnight. */
export function getQuestDayKey(date: Date = new Date()): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Milliseconds until the next server-local midnight (the reset moment). */
export function getNextQuestResetMs(date: Date = new Date()): number {
    const next = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1,
    );

    return next.getTime() - date.getTime();
}

/**
 * Ensures the user has quests generated for the current day. As soon as the
 * stored day key no longer matches today, the previous quests (completed or
 * not) are discarded and 3 fresh ones are generated. Server-side only — the
 * UI never decides when to reset.
 */
export async function ensureDailyQuests(
    client: Client,
    user: any,
    session?: ClientSession,
): Promise<DailyQuest[]> {
    const todayKey = getQuestDayKey();

    if (
        user.questDay !== todayKey ||
        !Array.isArray(user.quests) ||
        user.quests.length === 0
    ) {
        user.set('quests', generateDailyQuests(user.level));
        user.questDay = todayKey;
        await updateQuests(
            user.userId,
            user.quests as DailyQuest[],
            todayKey,
            session,
        );
    }

    return user.quests as unknown as DailyQuest[];
}

// ============================================
// PROGRESS TRACKING
// ============================================

function applyQuestProgress(
    quests: DailyQuest[],
    type: QuestType,
    amount: number,
): void {
    if (amount <= 0) return;

    for (const quest of quests) {
        if (quest.type !== type || quest.completed || quest.claimed) continue;

        quest.progress = Math.min(
            quest.requirement,
            quest.progress + Math.floor(amount),
        );

        quest.completed = quest.progress >= quest.requirement;
    }
}

/**
 * Advances quest progress at the point of the successful action, inside the
 * caller's transaction. Uses one fresh read so the per-user quest list is the
 * authoritative state (regenerates the day if a reset happened). Progress is
 * capped at the requirement; completed quests stop accumulating.
 *
 * Quests that become completed are auto-claimed right here (reward granted in
 * the same transaction, `claimed` marked before saving) and the user receives
 * a DM notification once per quest, exactly when it completes.
 */
export async function updateQuestProgress(
    client: Client,
    userId: string,
    updates: QuestProgressUpdate[],
    session?: ClientSession,
    channel?: TextBasedChannel | null,
): Promise<DailyQuest[] | null> {
    const valid = updates.filter((u) => u.amount > 0);

    if (valid.length === 0) {
        return null;
    }

    const fresh = await getUser(userId, session);

    if (!fresh) {
        return null;
    }

    const todayKey = getQuestDayKey();

    if (
        fresh.questDay !== todayKey ||
        !Array.isArray(fresh.quests) ||
        fresh.quests.length === 0
    ) {
        fresh.set('quests', generateDailyQuests(fresh.level));
        fresh.questDay = todayKey;
    }

    const quests = fresh.quests as DailyQuest[];

    const completedBefore = new Map(
        quests.map((quest) => [quest.questId, quest.completed]),
    );

    for (const update of valid) {
        applyQuestProgress(quests, update.type, update.amount);
    }

    const notices: QuestCompletedNotice[] = [];

    for (const quest of quests) {
        if (!quest.completed || quest.claimed) continue;

        const reward = await grantQuestReward(client, fresh, session);

        quest.claimed = true;

        if (!completedBefore.get(quest.questId)) {
            notices.push({ quest, reward });
        }
    }

    await updateQuests(userId, quests, todayKey, session);

    if (notices.length > 0) {
        await sendQuestCompletedNotice(
            client,
            channel,
            userId,
            notices,
            fresh.color as ColorResolvable,
        );
    }

    return quests;
}

export interface QuestRewardGrant {
    category: QuestRewardCategory;
    amount: number;
    levelUp?: LevelUpResult | null;
    charm?: {
        charmId: string;
        name: string;
        emoji: string;
        level: number;
        isNew: boolean;
    };
}

export interface QuestCompletedNotice {
    quest: DailyQuest;
    reward: QuestRewardGrant;
}

// ============================================
// AUTO CLAIM + NOTIFICATION
// ============================================

/** One-line reward summary, e.g. "💎 +7 Gems" (shared by DM + UI). */
export function formatQuestReward(
    client: Client,
    reward: QuestRewardGrant,
): string {
    if (reward.category === 'money') {
        return `${getEmoji(client, EMOJI_MONEY)} Tiền: **+$${reward.amount.toLocaleString()}**`;
    }

    if (reward.category === 'xp') {
        return `${getEmoji(client, EMOJI_XP)} +${reward.amount.toLocaleString()} XP`;
    }

    if (reward.category === 'gem') {
        return `${getEmoji(client, EMOJI_GEM)} +${reward.amount} Gems`;
    }

    return `${getEmoji(client, reward.charm!.emoji)} **${reward.charm!.name}**`;
}

/**
 * Rolls and grants exactly one level-scaled reward for a completed quest.
 * If no charms are registered the reward falls back to money.
 */
export async function grantQuestReward(
    client: Client,
    user: any,
    session?: ClientSession,
): Promise<QuestRewardGrant> {
    const category = rollQuestReward();

    if (category === 'money') {
        const reward = getDailyQuestMoneyReward(user.level);
        await updateBalance(user.userId, reward, session);
        return { category, amount: reward };
    }

    if (category === 'xp') {
        const reward = getDailyQuestXpReward(user.level);
        const levelUp = await addXp(user.userId, reward, session);
        return { category, amount: reward, levelUp };
    }

    if (category === 'gem') {
        const reward = rollDailyQuestGems();
        await updateGems(user.userId, reward, session);
        return { category, amount: reward };
    }

    const charms = Array.from(client.resources.charms.values());

    if (charms.length === 0) {
        const reward = getDailyQuestMoneyReward(user.level);
        await updateBalance(user.userId, reward, session);
        return { category: 'money', amount: reward };
    }

    const charm = charms[Math.floor(Math.random() * charms.length)]!;

    const owned = user.charms?.find((c: any) => c.charmId === charm.id);

    const amount = getDailyCharmReward(user.level);

    const ownedCharm = await addCharmCopies(
        client,
        user.userId,
        charm.id,
        amount,
        session,
    );

    return {
        category: 'charm',
        amount,
        charm: {
            charmId: charm.id,
            name: charm.name,
            emoji: charm.emoji,
            level: ownedCharm.level,
            isNew: !owned,
        },
    };
}

const DEFAULT_ACCENT_COLOR = '#5865F2';

function resolveAccentColor(colorResolvable: ColorResolvable): number {
    try {
        return resolveColor(colorResolvable);
    } catch {
        return resolveColor(DEFAULT_ACCENT_COLOR);
    }
}

/** ComponentV2 message announcing exactly which quests completed and what was granted. */
export function buildQuestCompletedContainer(
    client: Client,
    userId: string,
    notices: QuestCompletedNotice[],
    colorResolvable: ColorResolvable,
): ContainerBuilder {
    const container = new ContainerBuilder().setAccentColor(
        resolveAccentColor(colorResolvable),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                `<@${userId}>`,
                `### ${getEmoji(client, EMOJI_QUEST)} **Nhiệm vụ hoàn thành!**`,
            ].join('\n'),
        ),
    );

    notices.forEach((notice, index) => {
        const def = getQuestDef(notice.quest.type as any);
        const emoji = def ? getEmoji(client, def.emoji) : '';

        const lines = [
            `${emoji} **${formatQuestGoal(notice.quest)}**`,
            '',
            `${getEmoji(client, EMOJI_GIFT)} **Đã nhận:**`,
            formatQuestReward(client, notice.reward),
        ];

        if (notice.reward.levelUp && notice.reward.levelUp.levelsGained > 0) {
            lines.push(
                '',
                `${getEmoji(client, EMOJI_LEVEL_UP)} **LEVEL UP!** Lv.${notice.reward.levelUp.oldLevel} → Lv.${notice.reward.levelUp.newLevel}`,
            );
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(lines.join('\n')),
        );

        if (index < notices.length - 1) {
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
            );
        }
    });

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            'Dùng `/quest` để xem nhiệm vụ hôm nay.',
        ),
    );

    return container;
}

/**
 * Sends the completion notification to the guild channel the action ran in,
 * mentioning the user. Skipped entirely outside a guild (e.g. DM
 * interactions) — there is no DM fallback. Fails gracefully: a missing
 * channel or missing send permission must never affect quest completion or
 * the granted reward.
 */
export async function sendQuestCompletedNotice(
    client: Client,
    channel: TextBasedChannel | null | undefined,
    userId: string,
    notices: QuestCompletedNotice[],
    colorResolvable?: ColorResolvable,
): Promise<void> {
    if (!channel || channel.isDMBased()) {
        return;
    }

    try {
        await channel.send({
            components: [
                buildQuestCompletedContainer(
                    client,
                    userId,
                    notices,
                    colorResolvable ?? DEFAULT_ACCENT_COLOR,
                ),
            ],
            allowedMentions: { users: [userId] },
            flags: MessageFlags.IsComponentsV2,
        });
    } catch (error) {
        console.error(
            `[Quest] Không thể gửi thông báo hoàn thành nhiệm vụ tới kênh ${channel.id} (user ${userId}):`,
            error,
        );
    }
}

/**
 * Sweeps leftover completed-but-unclaimed quests (legacy state from before
 * auto-claim) and grants their rewards. Used by `/quest` so no completed quest
 * can ever be stranded without a payout.
 */
export async function autoClaimLegacyCompletedQuests(
    client: Client,
    user: any,
): Promise<void> {
    const quests = user.quests as DailyQuest[];

    const hasLegacy = quests.some((quest) => quest.completed && !quest.claimed);

    if (!hasLegacy) {
        return;
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const fresh = await getUser(user.userId, session);

            if (!fresh) {
                return;
            }

            await ensureDailyQuests(client, fresh, session);

            const freshQuests = fresh.quests as DailyQuest[];

            for (const quest of freshQuests) {
                if (!quest.completed || quest.claimed) continue;

                await grantQuestReward(client, fresh, session);

                quest.claimed = true;
            }

            await updateQuests(
                fresh.userId,
                freshQuests,
                getQuestDayKey(),
                session,
            );
        });
    } finally {
        await session.endSession();
    }
}

// ============================================
// REWARDS
// ============================================

/** Money reward reuses the existing level-scaled economy formula. */
export function getDailyQuestMoneyReward(level: number): number {
    return Math.floor(getDailyMoneyReward(level) * QUEST_MONEY_SCALE);
}

/** XP reward as a fraction of the XP required at the current level. */
export function getDailyQuestXpReward(level: number): number {
    return Math.floor(getRequiredXp(level) * QUEST_XP_FRACTION);
}

/** Random whole gems within the configured inclusive range (1-10). */
export function rollDailyQuestGems(): number {
    return (
        QUEST_GEM.min +
        Math.floor(Math.random() * (QUEST_GEM.max - QUEST_GEM.min + 1))
    );
}

/** Weighted roll selecting exactly one reward type. */
export function rollQuestReward(): QuestRewardCategory {
    const entries = Object.entries(QUEST_REWARD_CHANCES) as [
        QuestRewardCategory,
        number,
    ][];

    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);

    let roll = Math.random() * total;

    for (const [category, weight] of entries) {
        roll -= weight;
        if (roll < 0) return category;
    }

    return entries[entries.length - 1]![0];
}
