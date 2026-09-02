import type { Client, ButtonInteraction } from 'discord.js';

export type ButtonHandler = (
    client: Client,
    interaction: ButtonInteraction,
) => Promise<void>;

export interface ButtonRoute {
    /** Exact customId match. */
    id?: string;
    /** customId prefix match (`customId.startsWith(prefix)`). */
    prefix?: string;
    handle: ButtonHandler;
}
