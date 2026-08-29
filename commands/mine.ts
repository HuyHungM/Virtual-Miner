import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    type ColorResolvable,
} from "discord.js";

import User from "../models/User";
import type { Command } from "../types/Command";

import { mine } from "../services/mining/MiningService";

function createMiningButtons() {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("mine:again")
                .setLabel("Đào tiếp")
                .setEmoji("⛏️")
                .setStyle(
                    ButtonStyle.Primary,
                ),

            new ButtonBuilder()
                .setCustomId("mine:sell")
                .setLabel("Bán tất cả")
                .setEmoji("💰")
                .setStyle(
                    ButtonStyle.Success,
                ),
        );
}

async function executeMine(
    client: any,
    interaction: any,
) {
    const user =
        await User.findOne({
            userId:
                interaction.user.id,
        });

    if (!user) {
        await interaction.reply({
            content:
                "Bạn chưa tạo tài khoản.\n" +
                "`/start` để bắt đầu hành trình cày cuốc của bạn.",
            flags:
                MessageFlags.Ephemeral,
        });

        return;
    }

    const result =
        await mine(
            client,
            user,
        );

    if (!result.success) {
        switch (
            result.reason
        ) {
            case "RESOURCE_NOT_FOUND": {
                await interaction.reply({
                    content:
                        "Đã xảy ra lỗi khi tải tài nguyên.",
                    flags:
                        MessageFlags.Ephemeral,
                });

                return;
            }

            case "PICKAXE_TOO_WEAK": {
                const minimumPickaxe =
                    result.minimumPickaxe;

                const emoji =
                    minimumPickaxe
                        ? (
                            client.appEmojis.get(
                                minimumPickaxe.emoji,
                            ) ?? ""
                        )
                        : "";

                const embed =
                    new EmbedBuilder()
                        .setColor(
                            user.color as ColorResolvable,
                        )
                        .setTitle(
                            "⛏️ Không thể đào",
                        )
                        .setDescription(
                            [
                                "Cây cúp của bạn không đủ mạnh để đào biome này.",
                                "",
                                `Yêu cầu tối thiểu: ${emoji} **${
                                    minimumPickaxe?.name ??
                                    "Không xác định"
                                }**`,
                            ].join("\n"),
                        );

                await interaction.reply({
                    embeds: [
                        embed,
                    ],
                });

                return;
            }

            case "NO_ORE": {
                await interaction.reply({
                    content:
                        "Biome này hiện chưa có quặng.",
                    flags:
                        MessageFlags.Ephemeral,
                });

                return;
            }
        }

        return;
    }

    const oreLines =
        result.ores.map(
            ({
                ore,
                amount,
                xp,
            }) => {
                const emoji =
                    client.appEmojis.get(
                        ore.emoji,
                    ) ?? "";

                return [
                    `${emoji} **${ore.name}** ×${amount}`,
                    `└ ✨ ${xp.toLocaleString()} XP`,
                ].join("\n");
            },
        );

    const description: string[] = [
        oreLines.join("\n"),
        `✨ **Mining XP: +${result.miningXp.toLocaleString()}**`,
    ];

    if (result.chest.opened) {
        description.push(
            [
                "🎁 **Rương kho báu!**",
                `💰 Tiền: **+$${
                    result.chest.money.toLocaleString()
                }**`,
                `✨ XP: **+${
                    result.chest.xp.toLocaleString()
                }**`,
            ].join("\n"),
        );
    }

    if (
        result.chest.opened &&
        result.chest.xp > 0
    ) {
        description.push(
            `📈 **Tổng XP: +${result.totalXp.toLocaleString()}**`,
        );
    }

    if (
        result.levelUp &&
        result.levelUp.levelsGained > 0
    ) {
        description.push(
            [
                "🎉 **LEVEL UP!**",
                `Lv.${result.levelUp.oldLevel} → Lv.${result.levelUp.newLevel}`,
            ].join("\n"),
        );
    }

    const embed =
        new EmbedBuilder()
            .setColor(
                user.color as ColorResolvable,
            )
            .setTitle(
                "⛏️ Khai thác thành công",
            )
            .setDescription(
                description.join(
                    "\n\n",
                ),
            )
            .setFooter({
                text:
                    `${result.biome.name} • ` +
                    `${result.pickaxe.name}`,
            });

    const buttons =
        createMiningButtons();

    if (
        interaction.isButton()
    ) {
        await interaction.update({
            embeds: [
                embed,
            ],
            components: [
                buttons,
            ],
        });

        return;
    }

    await interaction.reply({
        embeds: [
            embed,
        ],
        components: [
            buttons,
        ],
    });
}

export default {
    name: "mine",
    description: "Đi đào khoáng sản",

    run: async (
        client,
        interaction,
    ) => {
        await executeMine(
            client,
            interaction,
        );
    },
} satisfies Command;
