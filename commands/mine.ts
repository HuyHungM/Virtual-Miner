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
import {
    getEmoji,
    setButtonEmoji,
    EMOJI_XP,
    EMOJI_MONEY,
    EMOJI_GEM,
    EMOJI_CHEST,
    EMOJI_PET,
    EMOJI_PICKAXE,
    EMOJI_LEVEL_UP,
} from '../services/emoji/EmojiService';

function createButtons(client: Client, pickaxeEmoji: string) {
    const againButton = new ButtonBuilder()
        .setCustomId('mine:again')
        .setLabel('Đào tiếp')
        .setStyle(ButtonStyle.Primary);

    setButtonEmoji(againButton, client, pickaxeEmoji);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        againButton,

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
                    ? getEmoji(client, minimumPickaxe.emoji)
                    : '';

                const container = new ContainerBuilder()
                    .setAccentColor(resolveColor(user.color as ColorResolvable))

                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `### ${getEmoji(client, EMOJI_PICKAXE)} Không thể đào`,
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
        const emoji = getEmoji(client, ore.emoji);

        return [
            `${emoji ?? ''} **${ore.name}** ×${amount}`,
            `      └ *${xp.toLocaleString()} XP*`,
        ].join('\n');
    });

    // Description
    const description: string[] = [
        oreLines.join('\n'),
        `*+${result.miningXp.toLocaleString()} XP*`,
    ];

    if (result.chest.opened) {
        const chestE = getEmoji(client, EMOJI_CHEST);

        if (result.chest.reward_type === 'money') {
            description.push(
                `${chestE} **Rương kho báu!**\n${getEmoji(client, EMOJI_MONEY)} Tiền: **+$${result.chest.money.toLocaleString()}**`,
            );
        } else if (result.chest.reward_type === 'xp') {
            description.push(
                `${chestE} **Rương kho báu!**\nXP: **+${result.chest.xp.toLocaleString()}**`,
            );
        } else if (result.chest.reward_type === 'gems') {
            description.push(
                `${chestE} **Rương kho báu!**\n${getEmoji(client, EMOJI_GEM)} Gem: **+${result.chest.gems}**`,
            );
        }
    }

    if (result.totalXp > 0) {
        description.push(`***Tổng: +${result.totalXp.toLocaleString()} XP***`);
    }

    if (result.levelUp && result.levelUp.levelsGained > 0) {
        description.push(
            [
                `${getEmoji(client, EMOJI_LEVEL_UP)} **LEVEL UP!**`,
                `Lv.${result.levelUp.oldLevel} → Lv.${result.levelUp.newLevel}`,
            ].join('\n'),
        );
    }

    // Pet XP
    if (result.petLevelUp) {
        const petDef = client.resources.pets.get(result.petLevelUp.petId);
        const petEmoji = petDef
            ? getEmoji(client, petDef.emoji)
            : getEmoji(client, EMOJI_PET);

        if (result.petLevelUp.levelsGained > 0) {
            description.push(
                [
                    `${petEmoji} **${petDef?.name ?? 'Pet'} leveling up!**`,
                    `Lv.${result.petLevelUp.oldLevel} → Lv.${result.petLevelUp.newLevel}`,
                ].join('\n'),
            );
        } else if (result.miningXp > 0) {
            description.push(
                `${petEmoji} **${petDef?.name ?? 'Pet'}:** *+${result.miningXp.toLocaleString()} Pet XP*`,
            );
        }
    }

    // Pet drop
    if (result.petDrop) {
        const petDropEmoji = getEmoji(client, result.petDrop.emoji);

        if (result.petDrop.isDuplicate) {
            description.push(
                [
                    `${petDropEmoji} **Rương kho báu!**`,
                    `Nhận được **${result.petDrop.name}** (đã sở hữu)`,
                    `+${result.petDrop.xpAwarded} Pet XP cho thú cưng hiện tại`,
                ].join('\n'),
            );
        } else {
            description.push(
                [
                    `${petDropEmoji} **Rương kho báu!**`,
                    `Bạn nhận được **${result.petDrop.name}**!`,
                ].join('\n'),
            );
        }
    }

    const container = new ContainerBuilder()
        .setAccentColor(resolveColor(user.color as ColorResolvable))

        // Title
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${interaction.user.username}`,
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
        .addActionRowComponents(createButtons(client, result.pickaxe.emoji));

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
