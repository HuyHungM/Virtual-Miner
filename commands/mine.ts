import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client,
    ContainerBuilder,
    MessageFlags,
    resolveColor,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type ColorResolvable,
} from 'discord.js';

import type { Command } from '../types/Command';

import { mine } from '../services/mining/MiningService';
import { getUser } from '../services/user/UserService';

function createButtons(pickaxeId: string) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('mine:again')
            .setLabel('Đào tiếp')
            .setEmoji(pickaxeId)
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('mine:sell')
            .setLabel('Bán')
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId('menu:back')
            .setLabel('Quay lại')
            .setStyle(ButtonStyle.Secondary),
    );
}

async function executeMine(client: Client, interaction: any) {
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

    const result = await mine(client, user);

    // Error
    if (!result.success) {
        switch (result.reason) {
            case 'RESOURCE_NOT_FOUND': {
                await interaction.reply({
                    content: 'Đã xảy ra lỗi khi tải tài nguyên.',
                    flags: MessageFlags.Ephemeral,
                });

                return;
            }

            case 'PICKAXE_TOO_WEAK': {
                const minimumPickaxe = result.minimumPickaxe;

                const emoji = minimumPickaxe
                    ? (client.appEmojis.get(minimumPickaxe.emoji) ?? '')
                    : '';

                const container = new ContainerBuilder()
                    .setAccentColor(resolveColor(user.color as ColorResolvable))

                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            '### ⛏️ Không thể đào',
                        ),
                    )

                    .addSeparatorComponents(
                        new SeparatorBuilder().setSpacing(
                            SeparatorSpacingSize.Small,
                        ),
                    )

                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            [
                                'Cây cúp của bạn không đủ mạnh để đào biome này.',
                                '',
                                `**Yêu cầu tối thiểu:** ${emoji} **${
                                    minimumPickaxe?.name ?? 'Không xác định'
                                }**`,
                            ].join('\n'),
                        ),
                    );

                await interaction.reply({
                    components: [container],
                    flags: MessageFlags.IsComponentsV2,
                });

                return;
            }

            case 'NO_ORE': {
                await interaction.reply({
                    content: 'Biome này hiện chưa có quặng.',
                    flags: MessageFlags.Ephemeral,
                });

                return;
            }
        }

        return;
    }

    // Ore content
    const oreLines = result.ores.map(({ ore, amount, xp }) => {
        const emoji = client.appEmojis.get(ore.emoji) ?? '';

        return [
            `${emoji} **${ore.name}** ×${amount}`,
            `└ ✨ ${xp.toLocaleString()} XP`,
        ].join('\n');
    });

    // Description
    const description: string[] = [
        oreLines.join('\n'),
        `✨ **XP: +${result.miningXp.toLocaleString()}**`,
    ];

    if (result.chest.opened) {
        description.push(
            [
                '🎁 **Rương kho báu!**',
                `💰 Tiền: **+$${result.chest.money.toLocaleString()}**`,
                `✨ XP: **+${result.chest.xp.toLocaleString()}**`,
            ].join('\n'),
        );
    }

    if (result.chest.opened && result.chest.xp > 0) {
        description.push(`📈 **Tổng XP: +${result.totalXp.toLocaleString()}**`);
    }

    if (result.levelUp && result.levelUp.levelsGained > 0) {
        description.push(
            [
                '🎉 **LEVEL UP!**',
                `Lv.${result.levelUp.oldLevel} → Lv.${result.levelUp.newLevel}`,
            ].join('\n'),
        );
    }

    const container = new ContainerBuilder()
        .setAccentColor(resolveColor(user.color as ColorResolvable))

        // Title
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${result.pickaxe ? client.appEmojis.get(result.pickaxe.emoji) : ''} Khai thác thành công`,
            ),
        )

        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        )

        // Ores + xp
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(description.join('\n\n')),
        )

        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        )

        // Footer
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `*${result.biome.name} • ${result.pickaxe.name}*`,
            ),
        )

        // Button
        .addActionRowComponents(createButtons(result.pickaxe.emoji));

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
    name: 'mine',
    description: 'Đi đào khoáng sản',

    run: async (client, interaction) => {
        await executeMine(client, interaction);
    },
} satisfies Command;
