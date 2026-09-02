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
import { computePetStatBonus } from '../services/pet/PetService';
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
    EMOJI_TRAP,
    EMOJI_STUN,
    EMOJI_SLOW,
    EMOJI_PIGLIN,
    EMOJI_MILK,
    EMOJI_COMBAT,
    EMOJI_HP,
    EMOJI_ATK,
    EMOJI_DEF,
} from '../services/emoji/EmojiService';

function formatDuration(ms: number): string {
    const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes <= 0) return `${seconds}s`;
    if (seconds === 0) return `${minutes}m`;
    return `${minutes}m ${seconds}s`;
}

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

    const result = await mine(client, user, interaction.channel);

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

            case 'STUNNED': {
                const remaining = formatDuration(result.remainingMs);

                await interaction.reply({
                    content:
                        `${getEmoji(client, EMOJI_STUN)} Bạn đang bị choáng và không thể đào trong ${remaining}.\n` +
                        `Dùng ${getEmoji(client, EMOJI_MILK)} **Sữa** để gỡ bỏ hiệu ứng ngay lập tức.`,
                    flags: MessageFlags.Ephemeral,
                });

                return;
            }

            case 'MINING_COOLDOWN': {
                const remaining = formatDuration(result.remainingMs);

                await interaction.reply({
                    content: `Bạn cần chờ **${remaining}** nữa trước khi đào tiếp.`,
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
                `${chestE} **Rương kho báu!**\n*+${result.chest.xp.toLocaleString()} XP*`,
            );
        } else if (result.chest.reward_type === 'gems') {
            description.push(
                `${chestE} **Rương kho báu!**\n${getEmoji(client, EMOJI_GEM)} Gem: **+${result.chest.gems}**`,
            );
        }

        // Pet drop
        if (result.petDrop) {
            const petDropEmoji = getEmoji(client, result.petDrop.emoji);

            if (result.petDrop.isDuplicate) {
                description.push(
                    [
                        `Nhận được ${petDropEmoji} **${result.petDrop.name}** (đã sở hữu)`,
                        `+${result.petDrop.xpAwarded} Pet XP cho thú cưng hiện tại`,
                    ].join('\n'),
                );
            } else {
                description.push(
                    [
                        `Bạn nhận được ${petDropEmoji} **${result.petDrop.name}**!`,
                    ].join('\n'),
                );
            }
        }
    }

    // Trap feedback (trapped chest)
    const trap = result.trap;

    if (trap && trap.kind === 'stun' && trap.trap?.durationMinutes) {
        description.push(
            [
                `${getEmoji(client, EMOJI_TRAP)} **Rương bẫy!**`,
                `Bạn vướng phải **Bẫy Choáng** và không thể đào trong ${trap.trap.durationMinutes} phút.`,
                `${getEmoji(client, EMOJI_MILK)} Dùng **Sữa** để gỡ bỏ hiệu ứng ngay.`,
            ].join('\n'),
        );
    } else if (trap && trap.kind === 'mining_slow' && trap.trap?.slowPercent) {
        const pct = Math.round(trap.trap.slowPercent * 100);
        description.push(
            [
                `${getEmoji(client, EMOJI_TRAP)} **Rương bẫy!**`,
                `Bạn vướng phải **Bẫy Làm Chậm** — tốc độ đào giảm ${pct}%.`,
                `${getEmoji(client, EMOJI_MILK)} Dùng **Sữa** để gỡ bỏ hiệu ứng ngay.`,
            ].join('\n'),
        );
    } else if (trap && trap.kind === 'piglin_robbery') {
        const combat = trap.combat;

        if (combat) {
            const petDef = user.equippedPet
                ? client.resources.pets.get(user.equippedPet)
                : undefined;
            const petEmoji = petDef
                ? getEmoji(client, petDef.emoji)
                : getEmoji(client, EMOJI_PET);
            const petName = petDef?.name ?? 'Thú cưng';
            const petLevel =
                user.pets?.find((p: any) => p.petId === user.equippedPet)
                    ?.level ?? 1;
            const piglinDef = client.resources.enemies.get('piglin');
            const piglinEmoji = piglinDef
                ? getEmoji(client, piglinDef.emoji)
                : getEmoji(client, EMOJI_PIGLIN);
            const piglinName = piglinDef?.name ?? 'Piglin';

            const card = [
                `${getEmoji(client, EMOJI_COMBAT)} **Rương bẫy!**`,
                `Một con **${piglinName}** xuất hiện!`,
                `${petEmoji} __**${petName}**__`,
                `${getEmoji(client, EMOJI_HP)} HP: ${Math.max(
                    0,
                    combat.petRemainingHealth,
                )} ${getEmoji(client, EMOJI_ATK)} ATK: ${
                    petDef?.combat_stats
                        ? Math.round(
                              computePetStatBonus(
                                  petDef.combat_stats.attack,
                                  petLevel,
                              ),
                          )
                        : 0
                } ${getEmoji(client, EMOJI_DEF)} DEF: ${
                    petDef?.combat_stats
                        ? Math.round(
                              computePetStatBonus(
                                  petDef.combat_stats.defense,
                                  petLevel,
                              ),
                          )
                        : 0
                }`,
                `vs.`,
                `${piglinEmoji} __**${piglinName}**__`,
                `${getEmoji(client, EMOJI_HP)} HP: ${Math.max(
                    0,
                    combat.enemyRemainingHealth,
                )} ${getEmoji(client, EMOJI_ATK)} ATK: ${
                    piglinDef?.combat_stats?.attack ?? 0
                } ${getEmoji(client, EMOJI_DEF)} DEF: ${
                    piglinDef?.combat_stats?.defense ?? 0
                }`,
            ].join('\n');

            if (combat.winner === 'pet') {
                description.push(
                    [
                        card,
                        '',
                        `${getEmoji(client, EMOJI_COMBAT)} **Chiến thắng!**`,
                        `Thú cưng của bạn đã đánh bại ${piglinName} trong ${combat.turns} lượt.`,
                        `Piglin không lấy được chút quặng nào.`,
                    ].join('\n'),
                );
            } else {
                description.push(
                    [
                        card,
                        '',
                        `${getEmoji(client, EMOJI_MILK)} **Thất bại!**`,
                        `Thú cưng của bạn đã bị đánh bại và ${piglinName} đã lấy trộm ${Math.round(
                            (trap.stolenPercent ?? 0) * 100,
                        )}% quặng của bạn.`,
                    ].join('\n'),
                );
            }
        } else if (trap.defended) {
            description.push(
                [
                    `${getEmoji(client, EMOJI_COMBAT)} **Rương bẫy!**`,
                    `Một con **Piglin** xuất hiện, nhưng thú cưng của bạn đã đánh bại nó!`,
                    `Quặng của bạn an toàn.`,
                ].join('\n'),
            );
        } else {
            description.push(
                [
                    `${getEmoji(client, EMOJI_PIGLIN)} **Rương bẫy!**`,
                    `Một con **Piglin** xuất hiện và đã lấy trộm ${Math.round(
                        (trap.stolenPercent ?? 0) * 100,
                    )}% quặng của bạn!`,
                    `Trang bị thú cưng chiến đấu để chống lại Piglin.`,
                ].join('\n'),
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

        description.push(
            `${petEmoji} **${petDef?.name ?? 'Pet'}:** *+${result.petLevelUp.xpGained.toLocaleString()} Pet XP*`,
        );

        if (result.petLevelUp.levelsGained > 0) {
            description.push(
                [
                    `${petEmoji} **${petDef?.name ?? 'Pet'} leveling up!**`,
                    `Lv.${result.petLevelUp.oldLevel} → Lv.${result.petLevelUp.newLevel}`,
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
