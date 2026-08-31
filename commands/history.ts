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
import { getHistory } from '../services/history/HistoryService';
import { getEmoji } from '../services/emoji/EmojiService';

export default {
    name: 'history',
    description: 'Xem lịch sử khai thác của bạn hoặc người khác',
    options: [
        {
            name: 'user',
            description: 'Người bạn muốn xem (bỏ trống để xem chính mình)',
            type: 6,
            required: false,
        },
    ],

    run: async (client, interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const targetUserId =
            interaction.options.getUser('user')?.id ?? interaction.user.id;

        const user = await getUser(targetUserId);

        if (!user) {
            await interaction.reply({
                content:
                    'Người chơi này chưa tạo tài khoản.\n' +
                    '`/start` để bắt đầu hành trình cày cuốc của bạn.',
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        const history = await getHistory(targetUserId);

        const username =
            interaction.user.id === targetUserId
                ? interaction.user.username
                : (interaction.options.getUser('user')?.username ??
                  (
                      await client.users
                          .fetch(targetUserId)
                          .catch(() => undefined)
                  )?.username ??
                  targetUserId);

        const inventory = history?.items ?? [];

        const entries = inventory
            .map((item) => ({
                ore: client.resources.ores.get(item.itemId),
                quantity: Number(item.quantity),
            }))
            .filter((e) => e.ore && e.quantity > 0)
            .sort((a, b) => b.quantity - a.quantity);

        const totalMined = entries.reduce((sum, e) => sum + e.quantity, 0);

        const oreLines =
            entries.length === 0
                ? ['Người chơi này chưa khai thác khoáng sản nào.']
                : entries.map((e) => {
                      const emoji = getEmoji(client, e.ore!.emoji);
                      return `${emoji} **${e.ore!.name}:** ${e.quantity.toLocaleString()} tổng`;
                  });

        const startedAt = history?.createdAt;

        const startedLine = startedAt
            ? `Bắt đầu khai thác từ **${startedAt.toLocaleDateString('vi-VN')}**.`
            : '';

        const container = new ContainerBuilder()
            .setAccentColor(resolveColor(user.color as ColorResolvable))

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### Lịch sử khai thác của ${username}`,
                ),
            )

            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [startedLine, oreLines.join('\n')]
                        .filter(Boolean)
                        .join('\n\n'),
                ),
            )

            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Tổng cộng: ${totalMined.toLocaleString()} khoáng sản** đã khai thác.`,
                ),
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
} satisfies Command;
