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
import type { OwnedPet, Pet, PetRarity } from '../types/Pet';

import { getUser } from '../services/user/UserService';
import {
    getRequiredPetXp,
    computePetStatBonus,
} from '../services/pet/PetService';
import {
    getEmoji,
    setButtonEmoji,
    EMOJI_PET,
    EMOJI_ARROW_LEFT,
    EMOJI_ARROW_RIGHT,
} from '../services/emoji/EmojiService';
import { PET_MAX_LEVEL } from '../services/balance/BalanceConfig';

export type PetTab = 'collection' | 'owned';

const RARITY_LABELS: Record<PetRarity, string> = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
    mythic: 'Mythic',
};

const RARITY_COLORS: Record<PetRarity, string> = {
    common: '#9e9e9e',
    uncommon: '#4caf50',
    rare: '#2196f3',
    epic: '#9c27b0',
    legendary: '#ff9800',
    mythic: '#f44336',
};

const RARITY_ORDER: Record<string, number> = {
    mythic: 6,
    legendary: 5,
    epic: 4,
    rare: 3,
    uncommon: 2,
    common: 1,
};

const PETS_PER_PAGE = 4;
const COLLECTION_PER_PAGE = 4;

type ClientRef = Parameters<Command['run']>[0];

function formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
}

function buildXpBar(percent: number, width = 10): string {
    const clamped = Math.max(0, Math.min(100, percent));
    const filled = Math.round((clamped / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

function petEmoji(client: ClientRef, def: Pet): string {
    return getEmoji(client, def.emoji) || getEmoji(client, EMOJI_PET);
}

function statLabel(stat: string): string {
    const names: Record<string, string> = {
        effective: 'Hiệu quả',
        fortune: 'May mắn',
        xp_multiplier: 'Nhân XP',
        chest_chance: 'Tỷ lệ rương',
        chest_quality: 'Chất lượng rương',
        sell_price: 'Giá bán',
    };
    return names[stat] ?? stat;
}

function buildStatLines(def: Pet, level: number): string[] {
    const lines: string[] = [];

    for (const [stat, base] of Object.entries(def.baseStats)) {
        if (base === 0) continue;
        const bonus = computePetStatBonus(base as number, level);
        lines.push(`+${formatPercent(bonus)} **${statLabel(stat)}**`);
    }

    return lines.length ? lines : ['Không có hiệu ứng'];
}

function pageInfo(page: number, totalPages: number): string {
    return `**Trang ${page + 1}/${totalPages}**`;
}

function tabButton(tab: PetTab, activeTab: PetTab): ButtonBuilder {
    const isActive = tab === activeTab;
    const label = tab === 'collection' ? 'Bộ sưu tập' : 'Thú cưng của tôi';

    return new ButtonBuilder()
        .setCustomId(`pet:${tab}:0`)
        .setLabel(label)
        .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(isActive);
}

function navRow(
    client: ClientRef,
    activeTab: PetTab,
    page: number,
    totalPages: number,
): ActionRowBuilder<MessageActionRowComponentBuilder> {
    const prevButton = new ButtonBuilder()
        .setCustomId(`pet:prev:${activeTab}:${page}`)
        .setLabel('Trước')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0);

    const nextButton = new ButtonBuilder()
        .setCustomId(`pet:next:${activeTab}:${page}`)
        .setLabel('Sau')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= totalPages - 1);

    setButtonEmoji(prevButton, client, EMOJI_ARROW_LEFT);
    setButtonEmoji(nextButton, client, EMOJI_ARROW_RIGHT);

    return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        tabButton('collection', activeTab),
        tabButton('owned', activeTab),
        prevButton,
        nextButton,
    );
}

function rarityHex(rarity: PetRarity): string {
    return RARITY_COLORS[rarity] ?? '#9e9e9e';
}

function rarityBadge(rarity: PetRarity): string {
    return `・**${RARITY_LABELS[rarity]}**`;
}

// ============================================
// COLLECTION TAB
// ============================================

function buildCollectionCard(
    client: ClientRef,
    user: any,
    def: Pet,
): ContainerBuilder {
    const owned = user.pets?.some((p: OwnedPet) => p.petId === def.id);
    const equipped = user.equippedPet === def.id;

    const container = new ContainerBuilder().setAccentColor(
        resolveColor(rarityHex(def.rarity) as ColorResolvable),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                `### ${petEmoji(client, def)} **${def.name}**`,
                `${rarityBadge(def.rarity)}${equipped ? ' • Đang trang bị' : ''}`,
            ].join('\n'),
        ),
        new TextDisplayBuilder().setContent(`\`${def.description}\``),
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            owned
                ? `Đã sở hữu ${equipped ? '• đang trang bị' : ''}`
                : 'Chưa sở hữu — hãy đào quặng tìm rương kho báu!',
        ),
    );

    return container;
}

function buildCollection(
    client: ClientRef,
    user: any,
    page: number,
    authorName: string,
): ContainerBuilder[] {
    const allPets = Array.from(client.resources.pets.values()).sort(
        (a: Pet, b: Pet) =>
            (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0),
    );

    const totalPages = Math.max(
        1,
        Math.ceil(allPets.length / COLLECTION_PER_PAGE),
    );
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    const start = currentPage * COLLECTION_PER_PAGE;
    const pagePets = allPets.slice(start, start + COLLECTION_PER_PAGE);

    const header = new ContainerBuilder().setAccentColor(
        resolveColor(user.color as ColorResolvable),
    );

    header.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `### ${getEmoji(client, EMOJI_PET)} ${authorName} • Bộ sưu tập thú cưng`,
        ),
        new TextDisplayBuilder().setContent(
            `Sở hữu: **${(user.pets ?? []).length}/${allPets.length}** • ${pageInfo(currentPage, totalPages)}`,
        ),
    );

    const cards = pagePets.map((def: Pet) =>
        buildCollectionCard(client, user, def),
    );

    const footer = new ContainerBuilder().setAccentColor(
        resolveColor(user.color as ColorResolvable),
    );

    footer.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    footer.addActionRowComponents(
        navRow(client, 'collection', currentPage, totalPages),
    );

    return [header, ...cards, footer];
}

// ============================================
// OWNED TAB
// ============================================

function buildOwnedCard(
    client: ClientRef,
    user: any,
    owned: OwnedPet,
    def: Pet,
): ContainerBuilder {
    const isEquipped = user.equippedPet === def.id;

    const xpRequired =
        owned.level >= PET_MAX_LEVEL ? 0 : getRequiredPetXp(owned.level);
    const xpPercent =
        owned.level >= PET_MAX_LEVEL
            ? 100
            : Math.round((owned.xp / xpRequired) * 100);
    const xpText =
        owned.level >= PET_MAX_LEVEL
            ? 'MAX'
            : `${owned.xp.toLocaleString()}/${xpRequired.toLocaleString()} XP`;

    const statLines = buildStatLines(def, owned.level);

    const container = new ContainerBuilder().setAccentColor(
        resolveColor(rarityHex(def.rarity) as ColorResolvable),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                `### ${petEmoji(client, def)} **${def.name}**`,
                `${rarityBadge(def.rarity)} • Lv.**${owned.level}/${PET_MAX_LEVEL}**${isEquipped ? ' • 『 ĐANG TRANG BỊ 』' : ''}`,
            ].join('\n'),
        ),
        new TextDisplayBuilder().setContent(
            [
                `\`${buildXpBar(xpPercent)}\` **${xpPercent}%**`,
                `${xpText}`,
                '',
                statLines.join('\n'),
            ].join('\n'),
        ),
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();
    if (isEquipped) {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId('pet:unequip')
                .setLabel('Bỏ trang bị')
                .setStyle(ButtonStyle.Danger),
        );
    } else {
        actionRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`pet:equip:${def.id}`)
                .setLabel('Trang bị')
                .setStyle(ButtonStyle.Success),
        );
    }
    container.addActionRowComponents(actionRow);

    return container;
}

function buildOwned(
    client: ClientRef,
    user: any,
    page: number,
    authorName: string,
): ContainerBuilder[] {
    const ownedWithDef = (user.pets ?? ([] as OwnedPet[]))
        .map((op: OwnedPet) => ({
            owned: op,
            def: client.resources.pets.get(op.petId),
        }))
        .filter(
            (e: {
                owned: OwnedPet;
                def: Pet | undefined;
            }): e is { owned: OwnedPet; def: Pet } => !!e.def,
        )
        .sort(
            (
                a: { owned: OwnedPet; def: Pet },
                b: { owned: OwnedPet; def: Pet },
            ) =>
                (RARITY_ORDER[b.def.rarity] ?? 0) -
                (RARITY_ORDER[a.def.rarity] ?? 0),
        );

    const totalPages = Math.max(
        1,
        Math.ceil(ownedWithDef.length / PETS_PER_PAGE),
    );
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    const start = currentPage * PETS_PER_PAGE;
    const pagePets = ownedWithDef.slice(start, start + PETS_PER_PAGE);

    const equippedDef = user.equippedPet
        ? client.resources.pets.get(user.equippedPet)
        : undefined;

    const equippedLine = equippedDef
        ? ` • Đang trang bị: ${petEmoji(client, equippedDef)} **${equippedDef.name}**`
        : '';

    const header = new ContainerBuilder().setAccentColor(
        resolveColor(user.color as ColorResolvable),
    );

    header.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `### ${getEmoji(client, EMOJI_PET)} ${authorName} • Thú cưng của bạn`,
        ),
        new TextDisplayBuilder().setContent(
            `Sở hữu: **${ownedWithDef.length}/${client.resources.pets.size}**${equippedLine} • ${pageInfo(currentPage, totalPages)}`,
        ),
    );

    let cards: ContainerBuilder[];

    if (pagePets.length === 0) {
        const empty = new ContainerBuilder().setAccentColor(
            resolveColor(user.color as ColorResolvable),
        );
        empty.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `${getEmoji(client, EMOJI_PET)} Bạn chưa có thú cưng nào.\nThú cưng có thể rơi từ rương kho báu khi đào quặng!`,
            ),
        );
        cards = [empty];
    } else {
        cards = pagePets.map(({ owned, def }: { owned: OwnedPet; def: Pet }) =>
            buildOwnedCard(client, user, owned, def),
        );
    }

    const footer = new ContainerBuilder().setAccentColor(
        resolveColor(user.color as ColorResolvable),
    );

    footer.addActionRowComponents(
        navRow(client, 'owned', currentPage, totalPages),
    );

    return [header, ...cards, footer];
}

// ============================================
// ENTRY
// ============================================

export async function executePets(
    client: ClientRef,
    interaction: Parameters<Command['run']>[1],
    tab: PetTab = 'owned',
    page = 0,
) {
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

    const authorName = interaction.user.username;

    const components =
        tab === 'collection'
            ? buildCollection(client, user, page, authorName)
            : buildOwned(client, user, page, authorName);

    const payload = { components, flags: MessageFlags.IsComponentsV2 } as const;

    if (interaction.isButton()) {
        await interaction.update(payload);
        return;
    }

    await interaction.reply(payload);
}

export default {
    name: 'pets',
    description: 'Xem và quản lý thú cưng',

    run: async (client, interaction) => {
        await executePets(client, interaction, 'owned', 0);
    },
} satisfies Command;
