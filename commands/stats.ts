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
import { getPlayerMultipliers } from '../services/stats/StatsService';
import { getEmoji, EMOJI_PICKAXE } from '../services/emoji/EmojiService';

function formatMultiplier(value: number): string {
    const rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
}

export default {
    name: 'stats',
    description: 'Xem tổng hệ số nhân (nâng cấp + cúp + thuốc) của bạn',

    run: async (client, interaction) => {
        const user = await getUser(interaction.user.id);

        if (!user) {
            await interaction.reply({
                content:
                    'Bạn chưa tạo tài khoản.\n' +
                    '`/start` để bắt đầu hành trình cày cuốc của bạn.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const pickaxe = client.resources.pickaxes.get(user.pickaxe);

        const stats = getPlayerMultipliers(client, user);

        const statLines = stats.map((s) => {
            const parts = [
                `**${getEmoji(client, s.emoji)} ${s.name}:** ×${formatMultiplier(s.total)}`,
                `      └ Nâng cấp ×${formatMultiplier(s.base)} • Cúp +${formatPercent(
                    s.pickaxeBonus,
                )} • Thuốc +${formatPercent(s.boostBonus)} • Thú cưng +${formatPercent(s.petBonus)}`,
            ];

            return parts.join('\n');
        });

        const pickaxeName = pickaxe
            ? `${getEmoji(client, pickaxe.emoji)} **${pickaxe.name}**`
            : `${getEmoji(client, EMOJI_PICKAXE)} **Không xác định**`;

        const container = new ContainerBuilder()
            .setAccentColor(resolveColor(user.color as ColorResolvable))

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### ${interaction.user.username} • Thông số của bạn`,
                ),
            )

            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(statLines.join('\n\n')),
            )

            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `*Cúp đang dùng: ${pickaxeName}*`,
                ),
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
} satisfies Command;
