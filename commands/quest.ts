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

import { getUser } from '../services/user/UserService';
import {
    autoClaimLegacyCompletedQuests,
    ensureDailyQuests,
    formatQuestGoal,
    getNextQuestResetMs,
    getQuestDef,
    type DailyQuest,
} from '../services/quest/QuestService';
import {
    getEmoji,
    setButtonEmoji,
    EMOJI_QUEST,
    EMOJI_CHECK,
    EMOJI_CLOCK,
} from '../services/emoji/EmojiService';

function formatDuration(ms: number): string {
    const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

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
            `${getEmoji(client, EMOJI_CLOCK)} Đặt lại sau: **${formatDuration(
                getNextQuestResetMs(),
            )}**`,
        ),
    );

    return container;
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

export async function executeQuest(
    client: Parameters<Command['run']>[0],
    interaction: Parameters<Command['run']>[1],
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

    await ensureDailyQuests(client, user);

    await autoClaimLegacyCompletedQuests(client, user);

    const fresh = await getUser(interaction.user.id);

    if (!fresh) {
        await interaction.reply({
            content:
                'Bạn chưa tạo tài khoản.\n' +
                '`/start` để bắt đầu hành trình cày cuốc của bạn.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

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
