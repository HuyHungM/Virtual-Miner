import type {
    Client,
    ChatInputCommandInteraction,
    ButtonInteraction,
} from 'discord.js';

export type CommandInteraction =
    ChatInputCommandInteraction | ButtonInteraction;

export interface Command {
    name: string;
    description: string;

    run: (client: Client, interaction: CommandInteraction) => Promise<void>;
}
