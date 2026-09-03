import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    resolveColor,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type ColorResolvable,
    type MessageActionRowComponentBuilder,
} from 'discord.js';

import type { Command } from '../types/Command';

import { getUserOrReply, replyOrUpdate } from '../shared/discord/interaction';

import { getEmoji, EMOJI_MONEY, EMOJI_MAP } from '../shared/emoji/EmojiService';

export async function executeBiome(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    const biomes = [...client.resources.biomes.values()].sort(
        (a, b) => a.unlock_level - b.unlock_level,
    );

    await replyOrUpdate(interaction, () => {
        const container = new ContainerBuilder().setAccentColor(
            resolveColor(user!.color as ColorResolvable),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${getEmoji(client, EMOJI_MAP)} ${interaction.user.username} • Chọn vùng khai thác`,
            ),
            new TextDisplayBuilder().setContent(
                [
                    `${getEmoji(client, EMOJI_MONEY)} Số dư: **$${user!.balance.toLocaleString()}**`,
                    `Cấp hiện tại: **Lv.${user!.level}**`,
                    `Đang ở: **${getEmoji(client, client.resources.biomes.get(user!.biome)?.emoji ?? '')} ${
                        client.resources.biomes.get(user!.biome)?.name ??
                        'Không xác định'
                    }**`,
                ].join('\n'),
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        for (const biome of biomes) {
            const minimumPickaxe = client.resources.pickaxes.get(
                biome.minimum_pickaxe,
            );

            const emoji = getEmoji(client, biome.emoji);

            const unlocked = user!.level >= biome.unlock_level;
            const isCurrent = user!.biome === biome.id;

            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            [
                                `### ${emoji} **${biome.name}**`,
                                biome.description,
                                `Mở khóa: **Lv.${biome.unlock_level}**`,
                                `Cúp tối thiểu: **${
                                    minimumPickaxe?.name ?? 'Không xác định'
                                }**`,
                            ].join('\n'),
                        ),
                    )
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId(`biome:switch:${biome.id}`)
                            .setLabel(
                                isCurrent
                                    ? 'Đang ở đây'
                                    : unlocked
                                      ? 'Đến'
                                      : `Cần Lv.${biome.unlock_level}`,
                            )
                            .setStyle(
                                isCurrent
                                    ? ButtonStyle.Success
                                    : ButtonStyle.Primary,
                            )
                            .setDisabled(!unlocked || isCurrent),
                    ),
            );
        }

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('menu:back')
                    .setLabel('Quay lại')
                    .setStyle(ButtonStyle.Secondary),
            ),
        );

        return container;
    });
}

export default {
    name: 'biome',
    description: 'Chọn vùng khai thác',
    run: async (client, interaction) => {
        await executeBiome(client, interaction);
    },
} satisfies Command;
