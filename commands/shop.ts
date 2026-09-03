import {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    ButtonBuilder,
    ButtonStyle,
    resolveColor,
    ActionRowBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    type MessageActionRowComponentBuilder,
    type ColorResolvable,
} from 'discord.js';

import type { Command } from '../types/Command';

import { getUserOrReply, replyOrUpdate } from '../shared/discord/interaction';

import {
    getNextShopLevel,
    getShopPage,
} from '../modules/equipment/PickaxeShopService';
import {
    getBoosts,
    getActiveBoosts,
    hasActiveBoost,
    getBoostRemainingTime,
    getBoostByGroup,
} from '../modules/boost/BoostShopService';
import { getUpgradePage } from '../modules/upgrade/UpgradeShopService';
import { getPotionPrice } from '../modules/boost/PotionShopService';
import {
    getBackpackBiomePage,
    getNextBackpackUnlock,
    getEquippedBackpack,
    isBackpackOwned,
} from '../modules/equipment/BackpackShopService';
import {
    getActiveTrap,
    hasTrapImmunity,
    getImmunityRemainingMs,
} from '../modules/chest/TrapService';
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
    EMOJI_BACKPACK,
    EMOJI_TRAP,
    EMOJI_CHECK,
} from '../shared/emoji/EmojiService';

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
            {
                id: 'shop:backpack',
                title: 'Ba lô',
                desc: 'Giảm thời gian chờ giữa mỗi lần đào.',
                emoji: EMOJI_BACKPACK,
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

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

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
    const nextShopLevel = getNextShopLevel(client, user.level);

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
                nextShopLevel
                    ? `*Cấp độ mở khoá tiếp theo: Lv.${nextShopLevel}*`
                    : '*Đã đạt đến giới hạn của Shop*',
            ),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Trang ${result.page + 1}/${result.totalPages}`,
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
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
                new ButtonBuilder()
                    .setCustomId('shop:menu')
                    .setLabel('Quay lại')
                    .setStyle(ButtonStyle.Secondary),
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

    const totalPages = 3;
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    const isPotionPage = currentPage >= totalPages - 1;
    const targetDuration = !isPotionPage ? (currentPage === 0 ? 10 : 30) : null;

    const boosts = isPotionPage
        ? []
        : getBoosts(client).filter(
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
                `### ${getEmoji(client, EMOJI_POTION)} ${interaction.user.username} • ${
                    isPotionPage
                        ? 'Cửa hàng liều thuốc chống bẫy'
                        : `Cửa hàng thuốc (${targetDuration} phút)`
                }`,
            ),
            new TextDisplayBuilder().setContent(headerLines.join('\n')),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        // ---- 🧪 Potions page (countermeasure items) ----
        if (isPotionPage) {
            const potionDefs = [...client.resources.potions.values()];
            const activeTrap = getActiveTrap(user);
            const hasTrap = activeTrap !== null;
            const immune = hasTrapImmunity(user);

            for (const potion of potionDefs) {
                const emoji = getEmoji(client, potion.emoji);
                const price = getPotionPrice(potion.id, user.level);
                let buyable = user.gems >= price;

                let statusLine = '';
                if (potion.id === 'milk') {
                    if (hasTrap) {
                        statusLine = `Có hiệu ứng ${getEmoji(client, EMOJI_TRAP)} đang hoạt động.`;
                    } else {
                        statusLine = 'Không có hiệu ứng đang hoạt động.';
                        buyable = false;
                    }
                } else if (potion.id === 'resist_potion') {
                    if (immune) {
                        const mins = Math.ceil(
                            getImmunityRemainingMs(user) / 60_000,
                        );
                        statusLine = `Đang miễn nhiễm (còn ${mins} phút).`;
                        buyable = false;
                    } else {
                        statusLine =
                            'Ngăn bẫy Choáng và Làm Chậm trong 10 phút.';
                    }
                }

                const description =
                    potion.description + (statusLine ? `\n${statusLine}` : '');

                container.addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                [
                                    `### ${emoji} **${potion.name}**`,
                                    description,
                                    `Giá: ${getEmoji(client, EMOJI_GEM)} **${price}**`,
                                ].join('\n'),
                            ),
                        )
                        .setButtonAccessory(
                            new ButtonBuilder()
                                .setCustomId(`potion:buy:${potion.id}`)
                                .setEmoji(client.appEmojis.get(EMOJI_GEM) ?? '')
                                .setLabel(buyable ? `${price}` : 'Mua')
                                .setStyle(
                                    buyable
                                        ? ButtonStyle.Primary
                                        : ButtonStyle.Secondary,
                                )
                                .setDisabled(!buyable),
                        ),
                );
            }
        } else {
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
                                    isActive
                                        ? 'Đang kích hoạt'
                                        : `${boost.price}`,
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
                    .setCustomId(`boost:prev:${currentPage}`)
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),

                new ButtonBuilder()
                    .setCustomId(`boost:next:${currentPage}`)
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage >= totalPages - 1),

                new ButtonBuilder()
                    .setCustomId('shop:menu')
                    .setLabel('Quay lại')
                    .setStyle(ButtonStyle.Secondary),
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
                    .setCustomId(`upgrade:prev:${result.page}`)
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(result.page === 0),

                new ButtonBuilder()
                    .setCustomId(`upgrade:next:${result.page}`)
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(result.page >= result.totalPages - 1),

                new ButtonBuilder()
                    .setCustomId('shop:menu')
                    .setLabel('Quay lại')
                    .setStyle(ButtonStyle.Secondary),
            ),
        );

        return container;
    });
}

// ============================================
// BACKPACK SHOP
// ============================================

export async function executeShopBackpacks(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
    page = 0,
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    const biome = client.resources.biomes.get(user.biome);
    const biomeName = biome?.name ?? user.biome;

    const result = getBackpackBiomePage(client, user, page);
    const nextUnlock = getNextBackpackUnlock(client, user);

    await replyOrUpdate(interaction, () => {
        const container = new ContainerBuilder().setAccentColor(
            resolveColor(user!.color as ColorResolvable),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### ${getEmoji(client, EMOJI_BACKPACK)} ${interaction.user.username} • Cửa hàng ba lô`,
            ),

            new TextDisplayBuilder().setContent(
                [
                    `${getEmoji(client, EMOJI_MONEY)} Số dư: **$${user!.balance.toLocaleString()}**`,
                    `${getEmoji(client, biome?.emoji ?? '')} Vùng hiện tại: **${biomeName}**`,
                ].join('\n'),
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        if (!result.biome) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '*Chưa có vùng ba lô nào được mở khoá.*',
                ),
            );
        } else {
            const pageBiome =
                client.resources.biomes.get(result.biome.id) ?? result.biome;

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### ${getEmoji(client, pageBiome.emoji)} **${pageBiome.name}**`,
                ),
            );

            for (const backpack of result.backpacks) {
                const emoji = getEmoji(client, backpack.emoji);
                const owned = isBackpackOwned(user, backpack.id);
                const equipped =
                    getEquippedBackpack(user)?.backpackId === backpack.id;

                const previousTier = result.backpacks.find(
                    (b) => b.tier === backpack.tier - 1,
                );
                const locked =
                    !!previousTier && !isBackpackOwned(user, previousTier.id);

                const buyable =
                    !owned && !locked && user!.balance >= backpack.price;

                const status = equipped
                    ? `${getEmoji(client, EMOJI_CHECK)} Đã sở hữu • Đang trang bị`
                    : owned
                      ? `${getEmoji(client, EMOJI_CHECK)} Đã sở hữu`
                      : 'Chưa sở hữu';

                let button;
                if (owned) {
                    button = new ButtonBuilder()
                        .setCustomId(
                            `backpack:owned:${backpack.id}:${result.page}`,
                        )
                        .setLabel(equipped ? 'Đang trang bị' : 'Đã sở hữu')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true);
                } else {
                    button = new ButtonBuilder()
                        .setCustomId(
                            `backpack:buy:${backpack.id}:${result.page}`,
                        )
                        .setEmoji(emoji)
                        .setLabel(`$${backpack.price.toLocaleString()}`)
                        .setStyle(
                            buyable
                                ? ButtonStyle.Primary
                                : ButtonStyle.Secondary,
                        )
                        .setDisabled(!buyable);
                }

                const lines = [
                    `### ${emoji} **${backpack.name}**`,
                    `*${pageBiome.name} • Tầng ${backpack.tier}/4*`,
                    `${getEmoji(client, EMOJI_CLOCK)} Giảm thời gian chờ: **-${backpack.tier * 0.25}s**`,
                    status,
                ];

                container.addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(
                                lines.filter(Boolean).join('\n'),
                            ),
                        )
                        .setButtonAccessory(button),
                );
            }
        }

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        if (nextUnlock) {
            const nextName = nextUnlock.biome.name;
            const nextEmoji = getEmoji(client, nextUnlock.biome.emoji);

            const requirement = nextUnlock.levelLocked
                ? `Cấp độ mở khoá tiếp theo: Lv.${nextUnlock.biome.unlock_level}`
                : `Mua đủ 4 ba lô vùng trước để mở ${nextEmoji} ${nextName}`;

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*${requirement}*`),
            );
        } else {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '*Đã mở khoá toàn bộ ba lô*',
                ),
            );
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `Trang ${result.page + 1}/${result.totalPages}`,
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addActionRowComponents(
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId(`backpack:prev:${result.page}`)
                    .setLabel('◀')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(result.page === 0),

                new ButtonBuilder()
                    .setCustomId(`backpack:next:${result.page}`)
                    .setLabel('▶')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(result.page >= result.totalPages - 1),

                new ButtonBuilder()
                    .setCustomId('shop:menu')
                    .setLabel('Quay lại')
                    .setStyle(ButtonStyle.Secondary),
            ),
        );

        return container;
    });
}

function toRoman(tier: number): string {
    const numerals = ['I', 'II', 'III', 'IV', 'V'];
    return numerals[tier - 1] ?? String(tier);
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
