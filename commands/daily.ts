import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    resolveColor,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type ColorResolvable,
    type MessageActionRowComponentBuilder,
} from 'discord.js';

import type { Command } from '../types/Command';

import { getUserOrReply, replyOrUpdate } from '../shared/discord/interaction';

import { claimDailyReward } from '../modules/daily/DailyRewardService';
import {
    getEmoji,
    EMOJI_GIFT,
    EMOJI_CLOCK,
    EMOJI_MONEY,
    EMOJI_XP,
    EMOJI_GEM,
    EMOJI_LEVEL_UP,
} from '../shared/emoji/EmojiService';
import { formatCountdown } from '../shared/utils/format';

function buildCooldownContainer(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
    user: any,
    remainingMs: number,
) {
    const container = new ContainerBuilder().setAccentColor(
        resolveColor(user.color as ColorResolvable),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`### ${interaction.user.username}`),
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${getEmoji(client, EMOJI_CLOCK)} Bạn cần chờ **${formatCountdown(
                remainingMs,
            )}** nữa trước khi nhận phần thưởng tiếp theo.`,
        ),
    );

    container.addActionRowComponents(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            backButton(),
        ),
    );

    return container;
}

function backButton() {
    return new ButtonBuilder()
        .setCustomId('menu:back')
        .setLabel('Quay lại')
        .setStyle(ButtonStyle.Secondary);
}

export async function executeDaily(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    const result = await claimDailyReward(client, user);

    // Cooldown
    if (!result.ok) {
        await replyOrUpdate(interaction, () =>
            buildCooldownContainer(
                client,
                interaction,
                user,
                result.remainingMs,
            ),
        );
        return;
    }

    const rewardLine =
        result.category === 'money'
            ? `${getEmoji(client, EMOJI_MONEY)} Tiền: **+$${result.amount.toLocaleString()}**`
            : result.category === 'xp'
              ? `${getEmoji(client, EMOJI_XP)} +${result.amount.toLocaleString()} XP`
              : result.category === 'gem'
                ? `${getEmoji(client, EMOJI_GEM)} +${result.amount} Gems`
                : `${getEmoji(client, result.charm!.emoji)} **${result.charm!.name}**`;

    const lines = [
        `${getEmoji(client, EMOJI_GIFT)} **Daily Reward**`,
        '',
        'Bạn đã nhận được:',
        rewardLine,
        '',
        `${getEmoji(client, EMOJI_CLOCK)} Phần thưởng tiếp theo sau 12 giờ.`,
    ];

    if (result.charm) {
        if (result.charm.isNew) {
            lines.splice(
                3,
                0,
                `*(mới! hiện ${result.charm.level === 1 ? 'Cấp 1' : `Cấp ${result.charm.level}`})*`,
            );
        } else {
            lines.splice(
                3,
                0,
                `*(đã sở hữu — nâng cấp ${getEmoji(client, result.charm.emoji)})*`,
            );
        }
    }

    if (result.levelUp && result.levelUp.levelsGained > 0) {
        lines.push(
            '',
            `${getEmoji(client, EMOJI_LEVEL_UP)} **LEVEL UP!**`,
            `Lv.${result.levelUp.oldLevel} → Lv.${result.levelUp.newLevel}`,
        );
    }

    await replyOrUpdate(interaction, () => {
        const container = new ContainerBuilder().setAccentColor(
            resolveColor(user.color as ColorResolvable),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${interaction.user.username}`,
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(lines.join('\n')),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                backButton(),
            ),
        );

        return container;
    });
}

export default {
    name: 'daily',
    description: 'Nhận phần thưởng hằng ngày (mỗi 12 giờ).',

    run: async (client, interaction) => {
        await executeDaily(client, interaction);
    },
} satisfies Command;
