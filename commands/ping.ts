import {
    ContainerBuilder,
    MessageFlags,
    resolveColor,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
} from 'discord.js';

import type { Command } from '../types/Command';

export default {
    name: 'ping',
    description: 'Kiểm tra độ trễ của bot',
    run: async (client, interaction) => {
        const apiLatency = client.ws.ping;
        const apiLatencyText = apiLatency < 0 ? '…' : `${apiLatency}ms`;
        const botLatency = Date.now() - interaction.createdTimestamp;

        const container = new ContainerBuilder().setAccentColor(
            resolveColor('#5865F2'),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('### 🏓 Pong!'),
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                [
                    `**Bot latency:** ${botLatency}ms`,
                    `**API latency:** ${apiLatencyText}`,
                ].join('\n'),
            ),
        );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    },
} satisfies Command;
