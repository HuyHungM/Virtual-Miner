import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, inlineCode, MessageFlags, resolveColor, SeparatorBuilder, SeparatorSpacingSize, TextDisplayBuilder, type ColorResolvable } from "discord.js";
import type { Command } from "../types/Command";
import User from "../models/User";
import { getInventory } from "../services/inventory/InventoryService";
import { getRequiredXp } from "../services/level/LevelService";
import { getUpgradeStats } from "../services/upgrade/UpgradeService";

function actionRow(pEmoji : string) {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("mine:again")
            .setLabel("Đi đào")
            .setEmoji(pEmoji)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("mine:sell")
            .setLabel("Bán tất cả")
            .setEmoji("💰")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("menu:shop")
            .setLabel("Tới cửa hàng")
            .setEmoji("🛒")
            .setStyle(ButtonStyle.Secondary),
    )   
}

async function Inventory(
    client: any,
    interaction: any
) {
    const user = 
        await User.findOne({
            userId: interaction.user.id
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

    const inv = 
        await getInventory(user.userId);

    if(!inv) {
        await interaction.reply({
            content:
                "Lỗi: Kho đồ không tồn tại.",
            flags:
                MessageFlags.Ephemeral,
        });

        return;
    }

    const nextLvlXp = getRequiredXp(user.xp); 
    const pickaxe = client.resources.pickaxes.get(user.pickaxe)
    const biome = client.resources.biomes.get(user.biome)
    const pEmoji = client.appEmojis.get(pickaxe.emoji) ?? ""
    const bEmoji = client.appEmojis.get(biome.emoji) ?? ""
    let totalValue = 0

    // Bằng 1 cách nào đó nó lấy luôn cái khoảng cách trước dòng :)
    const personal = `
Ngân sách: **$${user.balance}** 
**Cấp ${user.level}**, ${user.xp}/${nextLvlXp} XP để lên cấp. 
Cây cúp hiện tại: ${pEmoji} **${pickaxe.name}** 
Biome hiện tại: ${bEmoji} **${biome.name}**
    `

    const oreInv : string[] = inv.items.map(({ itemId, quantity }) => {
        const ore = client.resources.ores.get(itemId)
        const emoji = client.appEmojis.get(ore.emoji) ?? ""
        totalValue += ore.value*quantity
        return [
            `${emoji} **${ore.name}**  ×${quantity}`
        ].join('\n')       
    });

    if(!Array.isArray(oreInv) || oreInv.length === 0) oreInv.push("trống trơn")
    totalValue = totalValue*(1+getUpgradeStats(user).sell_price)

    const container = new ContainerBuilder()
        .setAccentColor(resolveColor(user.color as ColorResolvable))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### Kho đồ của ${interaction.user.displayName}`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        )
        // Thông tin cá nhân
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                personal
            )
        )
        
        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(false)
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "**[Kho đồ]**"
            )
        )
        // Liệt kê quặng có sẵn
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                oreInv.join('\n')
            )
        )
        // Tổng giá trị quặng
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Tổng giá trị: **__$${totalValue}__**`
            )
        )

        .addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small)
        )
        
        // Thêm nút
        .addActionRowComponents(actionRow(pickaxe.emoji))

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
    name: "menu",
    description: "Mở menu",
    run: async (
        client,
        interaction
    ) => {
        await Inventory(
            client,
            interaction
        );
    },
} satisfies Command;