import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    type ColorResolvable,
} from "discord.js";

import type { Command } from "../types/Command";

import { sellAll } from "../services/sell/SellService";
import { getUpgradeStats } from "../services/upgrade/UpgradeService";
import { getUser } from "../services/user/UserService";

function createButtons() {
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("mine:again")
                .setLabel("Đào tiếp")
                .setEmoji("⛏️")
                .setStyle(
                    ButtonStyle.Primary,
                ),
        );
}

export default {
    name: "sell",
    description: "Bán toàn bộ khoáng sản",

    run: async (client, interaction) => {
        const user = await getUser(interaction.user.id);

        if (!user) {
            await interaction.reply({
                content:
                    "Bạn chưa tạo tài khoản.\n" +
                    "`/start` để bắt đầu hành trình cày cuốc của bạn.",
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        const stats = getUpgradeStats(user);

        const result = await sellAll(
            user.userId,
            client.resources.ores,
            stats.sell_price,
        );

        if (!result) {
            await interaction.reply({
                content:
                    "Đã xảy ra lỗi khi bán khoáng sản.",
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        if (
            result.totalQuantity === 0 ||
            result.totalValue === 0
        ) {
            await interaction.reply({
                content:
                    "Kho đồ đang trống, có gì đâu mà bán.",
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        const embed = new EmbedBuilder()
            .setColor(
                user.color as ColorResolvable,
            )
            .setTitle("💰 Bán khoáng sản")
            .setDescription(
                [
                    `📦 Đã bán: **${result.soldItems} loại quặng**`,
                    `⛏️ Số lượng: **${result.totalQuantity.toLocaleString()}**`,
                    "",
                    `💰 Nhận được: **+$${result.totalValue.toLocaleString()}**`,
                ].join("\n"),
            );
        
        const buttons = createButtons();

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
    },
} satisfies Command;
