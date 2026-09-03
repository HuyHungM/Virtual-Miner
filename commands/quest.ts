import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    resolveColor,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    type ColorResolvable,
    type MessageActionRowComponentBuilder,
} from 'discord.js';

import type { Command } from '../types/Command';

import { getUserOrReply, replyOrUpdate } from '../shared/discord/interaction';

import {
    autoClaimLegacyCompletedQuests,
    ensureDailyQuests,
    formatQuestGoal,
    getNextQuestResetMs,
    getQuestDef,
    type DailyQuest,
} from '../modules/quest/QuestService';
import {
    getEmoji,
    setButtonEmoji,
    EMOJI_QUEST,
    EMOJI_CHECK,
    EMOJI_CLOCK,
} from '../shared/emoji/EmojiService';
import { formatCountdown } from '../shared/utils/format';

function buildQuestContainer(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
    user: any,
) {
    const container = new ContainerBuilder().setAccentColor(
        resolveColor(user.color as ColorResolvable),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `### ${getEmoji(client, EMOJI_QUEST)} **Nhiệm vụ hằng ngày**`,
        ),
    );

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    const quests = user.quests as DailyQuest[];

    quests.forEach((quest, index) => {
        const def = getQuestDef(quest.type as any);
        const emoji = def ? getEmoji(client, def.emoji) : '';

        const lines = [
            `### ${index + 1}. ${emoji} **${formatQuestGoal(quest)}**`,
            `${quest.progress.toLocaleString()} / ${quest.requirement.toLocaleString()}`,
        ];

        const button = new ButtonBuilder()
            .setCustomId(
                `quest:${quest.completed ? 'done' : 'none'}:${quest.questId}`,
            )
            .setLabel(quest.completed ? 'Đã nhận' : 'Chưa hoàn thành')
            .setStyle(
                quest.completed ? ButtonStyle.Success : ButtonStyle.Secondary,
            )
            .setDisabled(true);

        if (quest.completed) {
            setButtonEmoji(button, client, EMOJI_CHECK);
        }

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(lines.join('\n')),
                )
                .setButtonAccessory(button),
        );
    });

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `${getEmoji(client, EMOJI_CLOCK)} Đặt lại sau: **${formatCountdown(
                getNextQuestResetMs(),
            )}**`,
        ),
    );

    container.addActionRowComponents(
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('menu:back')
                .setLabel('Quay lại')
                .setStyle(ButtonStyle.Secondary),
        ),
    );

    return container;
}

export async function executeQuest(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
) {
    const user = await getUserOrReply(client, interaction);

    if (!user) return;

    await ensureDailyQuests(client, user);

    await autoClaimLegacyCompletedQuests(client, user);

    const fresh = await getUserOrReply(client, interaction);

    if (!fresh) return;

    await ensureDailyQuests(client, fresh);

    await replyOrUpdate(interaction, () =>
        buildQuestContainer(client, interaction, fresh),
    );
}

export default {
    name: 'quest',
    description: 'Xem nhiệm vụ hằng ngày của bạn.',

    run: async (client, interaction) => {
        await executeQuest(client, interaction);
    },
} satisfies Command;
