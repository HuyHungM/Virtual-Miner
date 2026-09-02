import {
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    resolveColor,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type ColorResolvable,
} from 'discord.js';

import type { Command } from '../types/Command';

import { getUserOrReply } from '../shared/discord/interaction';

import {
    getEmoji,
    setButtonEmoji,
    EMOJI_MONEY,
    EMOJI_GEM,
    EMOJI_PICKAXE,
    EMOJI_PET,
    EMOJI_SHOP,
    EMOJI_MAP,
    EMOJI_GLOBE,
    EMOJI_QUEST,
    EMOJI_GIFT,
} from '../shared/emoji/EmojiService';

const MENU_ITEMS: {
    id: string;
    title: string;
    desc: string;
    emoji: string;
}[] = [
    {
        id: 'menu:profile',
        title: 'Hồ sơ',
        desc: 'Xem hồ sơ của bạn hoặc người khác.',
        emoji: EMOJI_GLOBE,
    },
    {
        id: 'menu:quest',
        title: 'Nhiệm vụ',
        desc: 'Xem và nhận thưởng nhiệm vụ hằng ngày.',
        emoji: EMOJI_QUEST,
    },
    {
        id: 'menu:shop',
        title: 'Cửa hàng',
        desc: 'Mua cúp, thuốc và nâng cấp.',
        emoji: EMOJI_SHOP,
    },
    {
        id: 'menu:pets',
        title: 'Thú cưng',
        desc: 'Xem và quản lý thú cưng.',
        emoji: EMOJI_PET,
    },
    {
        id: 'menu:biome',
        title: 'Biome',
        desc: 'Chọn vùng khai thác.',
        emoji: EMOJI_MAP,
    },
    {
        id: 'menu:mine',
        title: 'Đi đào',
        desc: 'Đi đào khoáng sản.',
        emoji: EMOJI_PICKAXE,
    },
    {
        id: 'menu:sell',
        title: 'Bán',
        desc: 'Bán toàn bộ khoáng sản.',
        emoji: EMOJI_MONEY,
    },
    {
        id: 'menu:daily',
        title: 'Phần thưởng hằng ngày',
        desc: 'Nhận phần thưởng mỗi 12 giờ.',
        emoji: EMOJI_GIFT,
    },
];

export async function executeMenu(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    const container = new ContainerBuilder().setAccentColor(
        resolveColor(user.color as ColorResolvable),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `### ${getEmoji(client, EMOJI_PICKAXE)} ${interaction.user.username} • Menu chính`,
        ),
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            [
                `${getEmoji(client, EMOJI_MONEY)} Số dư: **$${user.balance.toLocaleString()}**`,
                `${getEmoji(client, EMOJI_GEM)} Gem: **${user.gems.toLocaleString()}**`,
            ].join('\n'),
        ),
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    for (const item of MENU_ITEMS) {
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `### ${getEmoji(client, item.emoji)} **${item.title}**\n${item.desc}`,
                    ),
                )
                .setButtonAccessory(
                    setButtonEmoji(
                        new ButtonBuilder()
                            .setCustomId(item.id)
                            .setLabel('Mở')
                            .setStyle(ButtonStyle.Primary),
                        client,
                        item.emoji,
                    ),
                ),
        );
    }

    const payload = {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    } as const;

    if (interaction.isButton()) {
        await interaction.update(payload);
        return;
    }

    await interaction.reply(payload);
}

export default {
    name: 'menu',
    description: 'Menu chính',
    run: async (client, interaction) => {
        await executeMenu(client, interaction);
    },
} satisfies Command;
