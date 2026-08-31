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
} from 'discord.js';

import User from '../models/User';
import type { Command } from '../types/Command';

import { getShopPage } from '../services/shop/PickaxeShopService';
import {
    getBoosts,
    getActiveBoosts,
    hasActiveBoost,
    getBoostRemainingTime,
    getBoostByGroup,
} from '../services/shop/BoostShopService';
import { getUpgradePage } from '../services/shop/UpgradeShopService';
import {
    getEmoji,
    setButtonEmoji,
    EMOJI_MONEY,
    EMOJI_GEM,
    EMOJI_SHOP,
    EMOJI_PICKAXE,
    EMOJI_UPGRADE,
    EMOJI_CLOCK,
    EMOJI_POTION,
} from '../services/emoji/EmojiService';

export async function getUserOrReply(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
) {
    const user = await User.findOne({
        userId: interaction.user.id,
    });

    if (!user) {
        await interaction.reply({
            content:
                'Bạn chưa tạo tài khoản.\n' +
                '`/start` để bắt đầu hành trình cày cuốc của bạn.',
            flags: MessageFlags.Ephemeral,
        });

        return null;
    }

    return user;
}

function replyOrUpdate(
    interaction: Parameters<Command['run']>[1],
    build: () => ContainerBuilder,
) {
    const container = build();

    if (interaction.isButton()) {
        return interaction.update({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    return interaction.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    });
}

function backRow(backId: string) {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(backId)
            .setLabel('Quay lại')
            .setStyle(ButtonStyle.Secondary),
    );
}

// ============================================
// MAIN MENU
// ============================================

export async function executeShopMenu(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    await replyOrUpdate(interaction, () => {
        const container = new ContainerBuilder().setAccentColor(
            resolveColor(user!.color as ColorResolvable),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${getEmoji(client, EMOJI_SHOP)} ${interaction.user.username} • Cửa hàng`,
            ),

            new TextDisplayBuilder().setContent(
                [
                    `${getEmoji(client, EMOJI_MONEY)} Số dư: **$${user!.balance.toLocaleString()}**`,
                    `${getEmoji(client, EMOJI_GEM)} Gem: **${user!.gems.toLocaleString()}**`,
                ].join('\n'),
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        const sections: {
            id: string;
            title: string;
            desc: string;
            emoji: string;
        }[] = [
            {
                id: 'shop:pickaxe',
                title: 'Cúp',
                desc: 'Mua và trang bị cây cúp tốt hơn.',
                emoji: EMOJI_PICKAXE,
            },
            {
                id: 'shop:boost',
                title: 'Thuốc',
                desc: 'Dùng gem mua hiệu ứng tạm thời.',
                emoji: EMOJI_POTION,
            },
            {
                id: 'shop:upgrade',
                title: 'Nâng cấp',
                desc: 'Tăng cường chỉ số vĩnh viễn.',
                emoji: EMOJI_UPGRADE,
            },
        ];

        for (const s of sections) {
            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `### ${getEmoji(client, s.emoji)} **${s.title}**\n${s.desc}`,
                        ),
                    )
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId(s.id)
                            .setLabel('Mở')
                            .setStyle(ButtonStyle.Primary),
                    ),
            );
        }

        container.addActionRowComponents(backRow('menu:back'));

        return container;
    });
}

// ============================================
// PICKAXE SHOP
// ============================================

export async function executeShopPickaxes(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
    page = 0,
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    const result = getShopPage(client, user.level, user.pickaxe, page);

    await replyOrUpdate(interaction, () => {
        const container = new ContainerBuilder().setAccentColor(
            resolveColor(user!.color as ColorResolvable),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${
                    result.currentPickaxe
                        ? getEmoji(client, result.currentPickaxe.emoji)
                        : ''
                } ${interaction.user.username} • Cửa hàng bán cúp`,
            ),

            new TextDisplayBuilder().setContent(
                `${getEmoji(client, EMOJI_MONEY)} Số dư: **$${user!.balance.toLocaleString()}**`,
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        for (const pickaxe of result.pickaxes) {
            const emoji = getEmoji(client, pickaxe.emoji);

            const buyable = user!.balance >= pickaxe.price;
            const owned = user!.unlocked_pickaxes.includes(pickaxe.id);

            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            [
                                `### ${emoji} **${pickaxe.name}**`,
                                pickaxe.description,
                            ].join('\n'),
                        ),
                    )
                    .setButtonAccessory(
                        setButtonEmoji(
                            new ButtonBuilder()
                                .setCustomId(
                                    `shop:select:${pickaxe.id}:${result.page}`,
                                )
                                .setLabel(
                                    `${owned ? (pickaxe.id === result.currentPickaxe?.id ? 'Đã trang bị' : 'Trang bị') : `$${pickaxe.price.toLocaleString()}`}`,
                                )
                                .setStyle(
                                    owned
                                        ? ButtonStyle.Success
                                        : ButtonStyle.Primary,
                                )
                                .setDisabled(
                                    (!owned && !buyable) ||
                                        pickaxe.id ===
                                            result.currentPickaxe?.id,
                                ),
                            client,
                            pickaxe.emoji,
                        ),
                    ),
            );
        }

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Trang ${result.page + 1}/${result.totalPages}`,
            ),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('shop:menu')
                    .setLabel('Quay lại')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId(`shop:prev:${result.page}`)
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(result.page === 0),

                new ButtonBuilder()
                    .setCustomId(`shop:next:${result.page}`)
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(result.page >= result.totalPages - 1),
            ),
        );

        return container;
    });
}

// ============================================
// BOOST SHOP
// ============================================

export async function executeShopBoosts(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
    page = 0,
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    const totalPages = 2;
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    const targetDuration = currentPage === 0 ? 10 : 30;

    const boosts = getBoosts(client).filter(
        (boost) => boost.duration === targetDuration,
    );
    const activeBoosts = getActiveBoosts(user);

    await replyOrUpdate(interaction, () => {
        const container = new ContainerBuilder().setAccentColor(
            resolveColor(user!.color as ColorResolvable),
        );

        const headerLines = [
            `${getEmoji(client, EMOJI_GEM)} Gem: **${user!.gems.toLocaleString()}**`,
        ];

        if (activeBoosts.length > 0) {
            const activeLine = activeBoosts
                .map((b) => {
                    const boost = getBoostByGroup(client, b.boostId);
                    const name = boost?.name ?? b.boostId;
                    return `**${name}** (còn ${getBoostRemainingTime(user!, b.boostId)} phút)`;
                })
                .join(', ');

            headerLines.push(
                `${getEmoji(client, EMOJI_CLOCK)} Đang kích hoạt: ${activeLine}`,
            );
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${getEmoji(client, EMOJI_POTION)} ${interaction.user.username} • Cửa hàng thuốc (${targetDuration} phút)`,
            ),
            new TextDisplayBuilder().setContent(headerLines.join('\n')),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        for (const boost of boosts) {
            const emoji = getEmoji(client, boost.emoji);
            const buyable = user!.gems >= boost.price;
            const isActive = hasActiveBoost(user, boost.boostId);

            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            [
                                `### ${emoji} **${boost.name}**`,
                                boost.description,
                            ].join('\n'),
                        ),
                    )
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId(`boost:buy:${boost.id}`)
                            .setEmoji(client.appEmojis.get(EMOJI_GEM) ?? '')
                            .setLabel(
                                isActive ? 'Đang kích hoạt' : `${boost.price}`,
                            )
                            .setStyle(
                                isActive
                                    ? ButtonStyle.Success
                                    : ButtonStyle.Primary,
                            )
                            .setDisabled(!buyable || isActive),
                    ),
            );
        }

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Trang ${currentPage + 1}/${totalPages}`,
            ),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('shop:menu')
                    .setLabel('Quay lại')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId(`boost:prev:${currentPage}`)
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),

                new ButtonBuilder()
                    .setCustomId(`boost:next:${currentPage}`)
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= totalPages - 1),
            ),
        );

        return container;
    });
}

// ============================================
// UPGRADE SHOP
// ============================================

export async function executeShopUpgrades(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
    page = 0,
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    const result = getUpgradePage(user, page);

    await replyOrUpdate(interaction, () => {
        const container = new ContainerBuilder().setAccentColor(
            resolveColor(user!.color as ColorResolvable),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${getEmoji(client, EMOJI_UPGRADE)} ${interaction.user.username} • Cửa hàng nâng cấp`,
            ),

            new TextDisplayBuilder().setContent(
                `${getEmoji(client, EMOJI_MONEY)} Số dư: **$${user!.balance.toLocaleString()}**`,
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        for (const { def, currentLevel, nextCost, maxed } of result.items) {
            const buyable = user!.balance >= nextCost && !maxed;

            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            [
                                `### ${getEmoji(client, def.emoji)} **${def.name}**`,
                                def.description,
                                `Cấp: **${currentLevel}/${def.maxLevel}**`,
                            ].join('\n'),
                        ),
                    )
                    .setButtonAccessory(
                        new ButtonBuilder()
                            .setCustomId(`upgrade:buy:${def.id}`)
                            .setLabel(
                                maxed
                                    ? 'Tối đa'
                                    : `Nâng cấp $${nextCost.toLocaleString()}`,
                            )
                            .setStyle(
                                maxed
                                    ? ButtonStyle.Secondary
                                    : ButtonStyle.Primary,
                            )
                            .setDisabled(!buyable),
                    ),
            );
        }

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Trang ${result.page + 1}/${result.totalPages}`,
            ),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('shop:menu')
                    .setLabel('Quay lại')
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId(`upgrade:prev:${result.page}`)
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(result.page === 0),

                new ButtonBuilder()
                    .setCustomId(`upgrade:next:${result.page}`)
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(result.page >= result.totalPages - 1),
            ),
        );

        return container;
    });
}

export async function executeShop(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
    page = 0,
) {
    await executeShopPickaxes(client, interaction, page);
}

export default {
    name: 'shop',
    description: 'Cửa hàng',

    run: async (client, interaction) => {
        await executeShopMenu(client, interaction);
    },
} satisfies Command;
