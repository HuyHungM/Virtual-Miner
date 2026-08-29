import type { Client, ChatInputCommandInteraction } from "discord.js";

export interface Command {
    name: string;
    description?: string;
    run: (
        client: Client,
        interaction: ChatInputCommandInteraction
    ) => void | Promise<void>;
}