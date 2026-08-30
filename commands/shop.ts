import {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    resolveColor,
    ActionRowBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    type MessageActionRowComponentBuilder,
    type ColorResolvable,
} from "discord.js";

import User from "../models/User";
import type { Command } from "../types/Command";

import {
    getShopPage,
} from "../services/shop/ShopService";

export async function executeShop(
    client: Parameters<Command["run"]>[0],
    interaction: Parameters<Command["run"]>[1],
    page = 0,
) {

    // Check user
    const user = await User.findOne({
        userId: interaction.user.id,
    });

    if (!user) {
        await interaction.reply({
            content:
                "Bạn chưa tạo tài khoản.\n" +
                "`/start` để bắt đầu hành trình cày cuốc của bạn.",
            flags: MessageFlags.Ephemeral,
        });

        return;
    }


    // Call service
    const result =
        getShopPage(
            client,
            user.level,
            user.pickaxe,
            page,
        );
    
    const containerComponent = new ContainerBuilder()
        .setAccentColor(resolveColor(user.color as ColorResolvable));
    
    // Title
    const titleComponent = new TextDisplayBuilder()
        .setContent(
            `### ${result.currentPickaxe
            ? client.appEmojis.get(result.currentPickaxe.emoji)
            : "⛏"} Cửa hàng bán cúp`
        );

    const balanceComponent = new TextDisplayBuilder()
        .setContent(`Số dư: **$${user.balance}**`);

    containerComponent
        .addTextDisplayComponents(
            titleComponent,
            balanceComponent,
        );

    containerComponent.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
    );

    // Description
    for (const pickaxe of result.pickaxes) {
            const emoji = client.appEmojis.get(pickaxe.emoji) ?? "";

            const buyable = user.balance >= pickaxe.price;
            const owned = user.unlocked_pickaxes.includes(pickaxe.id);

            const textComponent = new TextDisplayBuilder()
                .setContent([
                `### ${emoji} **${pickaxe.name}**`,
                pickaxe.description
            ].join("\n"))

            const buttonCompontent = new ButtonBuilder()
                .setCustomId(
                    `shop:select:${pickaxe.id}`,
                )
                .setLabel(`${owned ? (pickaxe.id === result.currentPickaxe?.id ? "Đã trang bị" : "Trang bị") : `$${pickaxe.price}`}`)
                .setEmoji(
                    client.appEmojis.get(
                        pickaxe.emoji,
                    ) ?? "⛏️",
                )
                .setStyle(
                    owned
                        ? ButtonStyle.Success
                        : ButtonStyle.Primary,
                )
                .setDisabled(
                    !buyable || pickaxe.id === result.currentPickaxe?.id,
                )

            const sectionComponent = new SectionBuilder()
                .addTextDisplayComponents(textComponent)
                .setButtonAccessory(buttonCompontent);

            containerComponent.addSectionComponents(sectionComponent);
        }

        // Footer
        containerComponent.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small))

        const pageComponent = new TextDisplayBuilder()
            .setContent(`Trang ${result.page + 1}/${result.totalPages}`);

        containerComponent.addTextDisplayComponents(pageComponent);
    
    // Navigation
    const navigation =
        new ActionRowBuilder<MessageActionRowComponentBuilder>()
            .addComponents(

                new ButtonBuilder()
                    .setCustomId(
                        "shop:menu",
                    )
                    .setLabel(
                        `Quay lại`,
                    )
                    .setStyle(
                        ButtonStyle.Secondary,
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `shop:prev:${result.page}`,
                    )
                    .setLabel("◀")
                    .setStyle(
                        ButtonStyle.Primary,
                    )
                    .setDisabled(
                        result.page === 0,
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        `shop:next:${result.page}`,
                    )
                    .setLabel("▶")
                    .setStyle(
                        ButtonStyle.Primary,
                    )
                    .setDisabled(
                        result.page >=
                            result.totalPages - 1,
                    ),
            );

    containerComponent.addActionRowComponents(navigation)

    if (interaction.isButton()) {
        await interaction.update({
            components: [containerComponent],
            flags: MessageFlags.IsComponentsV2
        });

        return;
    }

    await interaction.reply({
        components: [containerComponent],
        flags: MessageFlags.IsComponentsV2
    });
}

export default {
    name: "shop",
    description: "Cửa hàng bán cúp",

    run: async (
        client,
        interaction,
    ) => {
        await executeShop(
            client,
            interaction,
            0,
        );
    },
} satisfies Command;