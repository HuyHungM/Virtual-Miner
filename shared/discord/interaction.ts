import {
    ContainerBuilder,
    MessageFlags,
    TextDisplayBuilder,
    type Client,
} from 'discord.js';

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

/**
 * Renders a Component V2 error container, editing the message when the
 * interaction has already been deferred/replied (which is required after a V2
 * card exists) and replying otherwise. Never throws, so it is safe to call
 * from catch blocks.
 */
export async function replyV2Error(
    interaction: CommandInteraction,
    message: string,
) {
    const container = new ContainerBuilder().addTextDisplayComponents(
        new TextDisplayBuilder().setContent(message),
    );

    try {
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        } else {
            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
            });
        }
    } catch {
        // Interaction may have expired; never throw from an error handler.
    }
}
