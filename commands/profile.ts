import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    resolveColor,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type ColorResolvable,
    type MessageActionRowComponentBuilder,
} from 'discord.js';

import type { Command } from '../types/Command';

import { getUser } from '../services/user/UserService';
import { getInventory } from '../services/inventory/InventoryService';
import { getHistory } from '../services/history/HistoryService';
import { getPlayerMultipliers } from '../services/stats/StatsService';
import { getRequiredXp } from '../services/level/LevelService';
import {
    getEmoji,
    EMOJI_MONEY,
    EMOJI_XP,
    EMOJI_PICKAXE,
    EMOJI_GLOBE,
} from '../services/emoji/EmojiService';

async function resolveTargetUserId(
    interaction: Parameters<Command['run']>[1],
): Promise<string> {
    // Buttons carry the target in: profile:<tab>:<userid>
    if (interaction.isButton()) {
        const parts = interaction.customId.split(':');
        if (parts.length >= 3 && parts[2]) return parts[2];
    }

    // Chat input: target from the optional user option, else self.
    const optionUser = interaction.isChatInputCommand()
        ? interaction.options.getUser('user')
        : null;
    return optionUser?.id ?? interaction.user.id;
}

async function fetchUsername(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
    targetUserId: string,
): Promise<string> {
    if (interaction.isButton()) {
        return (
            (await client.users.fetch(targetUserId).catch(() => undefined))
                ?.username ?? targetUserId
        );
    }

    const optionUser = interaction.isChatInputCommand()
        ? interaction.options.getUser('user')
        : null;
    if (optionUser) return optionUser.username;

    return interaction.user.username;
}

function statButton(
    label: string,
    tab: 'inv' | 'stats' | 'hist',
    targetUserId: string,
    active: boolean,
) {
    return new ButtonBuilder()
        .setCustomId(`profile:${tab}:${targetUserId}`)
        .setLabel(label)
        .setStyle(active ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(active);
}

function navButtons(targetUserId: string, active: 'inv' | 'stats' | 'hist') {
    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        statButton('Kho', 'inv', targetUserId, active === 'inv'),
        statButton('Thống kê', 'stats', targetUserId, active === 'stats'),
        statButton('Lịch sử', 'hist', targetUserId, active === 'hist'),
    );
}

function buildHeader(
    client: Parameters<Command['run']>[0],
    target: any,
    username: string,
): string[] {
    const pickaxe = client.resources.pickaxes.get(target.pickaxe);
    const biome = client.resources.biomes.get(target.biome);

    const xpRequired = getRequiredXp(target.level);

    return [
        `> **Hồ sơ của ${username}**`,
        '',
        `${getEmoji(client, EMOJI_MONEY)} Số dư: **$${target.balance.toLocaleString()}**`,
        `${getEmoji(client, EMOJI_XP)} Lv.**${target.level}** – ${target.xp.toLocaleString()}/${xpRequired.toLocaleString()} XP`,
        `${getEmoji(client, EMOJI_PICKAXE)} Cúp: ${getEmoji(client, pickaxe?.emoji ?? '')} ${pickaxe?.name ?? 'Không xác định'}`,
        `${getEmoji(client, EMOJI_GLOBE)} Biome: ${getEmoji(client, biome?.emoji ?? '')} ${biome?.name ?? 'Không xác định'}`,
    ];
}

export async function executeProfileTab(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
    tab: 'inv' | 'stats' | 'hist',
    targetUserId?: string,
) {
    const resolvedTarget =
        targetUserId ?? (await resolveTargetUserId(interaction));

    const target = await getUser(resolvedTarget);

    if (!target) {
        await interaction.reply({
            content:
                'Người chơi này chưa tạo tài khoản.\n' +
                '`/start` để bắt đầu hành trình cày cuốc của bạn.',
            flags: MessageFlags.Ephemeral,
        });

        return;
    }

    const username = await fetchUsername(client, interaction, resolvedTarget);
    const header = buildHeader(client, target, username);

    let container: ContainerBuilder;

    if (tab === 'inv') {
        const inventory = await getInventory(resolvedTarget);

        const entries = (inventory?.items ?? [])
            .map((item) => ({
                ore: client.resources.ores.get(item.itemId),
                quantity: Number(item.quantity),
            }))
            .filter((e) => e.ore && e.quantity > 0)
            .sort((a, b) => b.quantity - a.quantity);

        const totalValue = entries.reduce(
            (sum, e) => sum + e.ore!.value * e.quantity,
            0,
        );

        const oreLines =
            entries.length === 0
                ? ['Kho đồ đang trống.']
                : entries.map((e) => {
                      const emoji = getEmoji(client, e.ore!.emoji);
                      return `${emoji} **${e.ore!.name}:** ${e.quantity.toLocaleString()} `;
                  });

        container = new ContainerBuilder().setAccentColor(
            resolveColor(target.color as ColorResolvable),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(header.join('\n')),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                ['### Kho khoáng sản', oreLines.join('\n')].join('\n'),
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**Giá trị kho: $${totalValue.toLocaleString()}**`,
            ),
        );

        container.addActionRowComponents(navButtons(resolvedTarget, 'inv'));
    } else if (tab === 'stats') {
        const stats = getPlayerMultipliers(client, target);

        const statLines = stats.map((s) => {
            const parts = [
                `**${getEmoji(client, s.emoji)} ${s.name}:** ×${(Math.round(s.total * 100) / 100).toLocaleString()}`,
                `      └ Nâng cấp ×${s.base.toLocaleString()} • Cúp +${Math.round(s.pickaxeBonus * 100)}% • Thuốc +${Math.round(s.boostBonus * 100)}% • Thú cưng +${Math.round(s.petBonus * 100)}%`,
            ];

            return parts.join('\n');
        });

        container = new ContainerBuilder().setAccentColor(
            resolveColor(target.color as ColorResolvable),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(header.join('\n')),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                ['### Thống kê', statLines.join('\n\n')].join('\n'),
            ),
        );

        container.addActionRowComponents(navButtons(resolvedTarget, 'stats'));
    } else {
        const history = await getHistory(resolvedTarget);

        const entries = (history?.items ?? [])
            .map((item) => ({
                ore: client.resources.ores.get(item.itemId),
                quantity: Number(item.quantity),
            }))
            .filter((e) => e.ore && e.quantity > 0)
            .sort((a, b) => b.quantity - a.quantity);

        const totalMined = entries.reduce((sum, e) => sum + e.quantity, 0);

        const oreLines =
            entries.length === 0
                ? ['Người chơi này chưa khai thác khoáng sản nào.']
                : entries.map((e) => {
                      const emoji = getEmoji(client, e.ore!.emoji);
                      return `${emoji} **${e.ore!.name}:** ${e.quantity.toLocaleString()} tổng`;
                  });

        container = new ContainerBuilder().setAccentColor(
            resolveColor(target.color as ColorResolvable),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(header.join('\n')),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                ['### Lịch sử khai thác', oreLines.join('\n')].join('\n'),
            ),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**Tổng cộng: ${totalMined.toLocaleString()} khoáng sản** đã khai thác.`,
            ),
        );

        container.addActionRowComponents(navButtons(resolvedTarget, 'hist'));
    }

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
    name: 'profile',
    description: 'Xem hồ sơ của bạn hoặc người khác',
    options: [
        {
            name: 'user',
            description: 'Người bạn muốn xem (bỏ trống để xem chính mình)',
            type: 6,
            required: false,
        },
    ],

    run: async (client, interaction) => {
        if (!interaction.isChatInputCommand()) return;

        await executeProfileTab(client, interaction, 'inv');
    },
} satisfies Command;
