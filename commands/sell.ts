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
} from 'discord.js';

import type { Command } from '../types/Command';

import { sellAll } from '../services/sell/SellService';
import { getUpgradeStats } from '../services/upgrade/UpgradeService';
import { getUser } from '../services/user/UserService';
import {
    getEmoji,
    setButtonEmoji,
    EMOJI_MONEY,
    EMOJI_PICKAXE,
    EMOJI_INVENTORY,
    EMOJI_ENDERCHEST,
} from '../services/emoji/EmojiService';
import { getPetBonusForStat } from '../services/pet/PetStatService';
import { getCharmBonusForStat } from '../services/charm/CharmService';

function createButtons(client: Parameters<Command['run']>[0]) {
    const againButton = new ButtonBuilder()
        .setCustomId('mine:again')
        .setLabel('Đào tiếp')
        .setStyle(ButtonStyle.Primary);

    setButtonEmoji(againButton, client, EMOJI_PICKAXE);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(againButton);
}

export default {
    name: 'sell',
    description: 'Bán toàn bộ khoáng sản',

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

        const result = await sellAll(client, user);

        if (!result) {
            await interaction.reply({
                content: 'Đã xảy ra lỗi khi bán khoáng sản.',
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        if (result.totalQuantity === 0 || result.totalValue === 0) {
            await interaction.reply({
                content: 'Kho đồ đang trống, có gì đâu mà bán.',
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        const moneyEmoji = getEmoji(client, EMOJI_MONEY);

        const container = new ContainerBuilder()
            .setAccentColor(resolveColor(user.color as ColorResolvable))

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### ${moneyEmoji} ${interaction.user.username} • Bán khoáng sản`,
                ),
            )

            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        `${getEmoji(client, EMOJI_INVENTORY)} Đã bán: **${result.soldItems} loại quặng**`,
                        `${getEmoji(client, EMOJI_PICKAXE)} Số lượng: **${result.totalQuantity.toLocaleString()}**`,
                        '',
                        `${moneyEmoji} Nhận được: **+$${result.totalValue.toLocaleString()}**`,
                        `${getEmoji(client, EMOJI_ENDERCHEST)} Tổng tiền: **$${(user.balance + result.totalValue).toLocaleString()}**`,
                    ].join('\n'),
                ),
            );

        const buttons = createButtons(client);

        if (interaction.isButton()) {
            await interaction.update({
                components: [container, buttons],
                flags: MessageFlags.IsComponentsV2,
            });

            return;
        }

        await interaction.reply({
            components: [container, buttons],
            flags: MessageFlags.IsComponentsV2,
        });
    },
} satisfies Command;
