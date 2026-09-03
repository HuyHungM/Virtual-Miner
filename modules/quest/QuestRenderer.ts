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
    EMOJI_QUEST,
    EMOJI_GIFT,
    EMOJI_LEVEL_UP,
    EMOJI_MONEY,
    EMOJI_XP,
    EMOJI_GEM,
    getEmoji,
} from '../../shared/emoji/EmojiService';
import {
    getQuestDef,
    formatQuestGoal,
    type QuestCompletedNotice,
    type QuestRewardGrant,
} from './QuestService';

const DEFAULT_ACCENT_COLOR = '#5865F2';

function resolveAccentColor(colorResolvable: ColorResolvable): number {
    try {
        return resolveColor(colorResolvable);
    } catch {
        return resolveColor(DEFAULT_ACCENT_COLOR);
    }
}

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
