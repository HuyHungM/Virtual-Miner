import {
    ContainerBuilder,
    MessageFlags,
    resolveColor,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type ColorResolvable,
} from 'discord.js';

import type { Command } from '../types/Command';

import { getUser } from '../services/user/UserService';
import { claimDailyReward } from '../services/daily/DailyRewardService';
import {
    getEmoji,
    EMOJI_GIFT,
    EMOJI_CLOCK,
    EMOJI_MONEY,
    EMOJI_XP,
    EMOJI_GEM,
    EMOJI_LEVEL_UP,
} from '../services/emoji/EmojiService';

function formatDuration(ms: number): string {
    const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

export default {
    name: 'daily',
    description: 'Nhận phần thưởng hằng ngày (mỗi 12 giờ).',

    run: async (client, interaction) => {
        const userId = interaction.user.id;
        const user = await getUser(userId);

        if (!user) {
            await interaction.reply({
                content:
                    'Bạn chưa tạo tài khoản.\n' +
                    '`/start` để bắt đầu hành trình cày cuốc của bạn.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const result = await claimDailyReward(client, user);

        // Cooldown
        if (!result.ok) {
            await interaction.reply({
                content: `${getEmoji(client, EMOJI_CLOCK)} Bạn cần chờ **${formatDuration(
                    result.remainingMs,
                )}** nữa trước khi nhận phần thưởng tiếp theo.`,
                flags: MessageFlags.Ephemeral,
            });
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

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
} satisfies Command;
