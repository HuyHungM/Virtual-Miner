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

import { sellAll } from '../modules/economy/SellService';
import { getUserOrReply } from '../shared/discord/interaction';
import {
    getEmoji,
    setButtonEmoji,
    EMOJI_MONEY,
    EMOJI_PICKAXE,
    EMOJI_INVENTORY,
    EMOJI_ENDERCHEST,
} from '../shared/emoji/EmojiService';

function createButtons(client: Parameters<Command['run']>[0]) {
    const againButton = new ButtonBuilder()
        .setCustomId('mining:continue')
        .setLabel('Đào tiếp')
        .setStyle(ButtonStyle.Primary);

    setButtonEmoji(againButton, client, EMOJI_PICKAXE);

    const menuButton = new ButtonBuilder()
        .setCustomId('mining:menu')
        .setLabel('Quay lại')
        .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        againButton,
        menuButton,
    );
}

export async function executeSell(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    const result = await sellAll(client, user, interaction.channel);

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

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    const buttons = createButtons(client);

    container.addActionRowComponents(buttons);

    if (interaction.isButton()) {
        await interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });

        return;
    }

    await interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    });
}

export default {
    name: 'sell',
    description: 'Bán toàn bộ khoáng sản',

    run: async (client, interaction) => {
        await executeSell(client, interaction);
    },
} satisfies Command;
