import { ContainerBuilder, MessageFlags, type Client } from 'discord.js';

import User from '../../models/User';
import type { CommandInteraction } from '../../types/Command';

const NO_ACCOUNT_REPLY =
    'Bạn chưa tạo tài khoản.\n' +
    '`/start` để bắt đầu hành trình cày cuốc của bạn.';

/**
 * Loads the acting user's profile, or replies "no account" and returns null
 * when they have not started yet. Shared by commands and button handlers so the
 * onboarding message stays consistent everywhere.
 */
export async function getUserOrReply(
    client: Client,
    interaction: CommandInteraction,
) {
    const user = await User.findOne({
        userId: interaction.user.id,
    });

    if (!user) {
        await interaction.reply({
            content: NO_ACCOUNT_REPLY,
            flags: MessageFlags.Ephemeral,
        });

        return null;
    }

    return user;
}

/**
 * Renders a Component V2 container, updating the message when the interaction
 * came from a button and replying otherwise.
 */
export function replyOrUpdate(
    interaction: CommandInteraction,
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
