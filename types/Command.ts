import type {
    Client,
    ChatInputCommandInteraction,
    ButtonInteraction,
} from 'discord.js';

export type CommandInteraction =
    ChatInputCommandInteraction | ButtonInteraction;

export interface CommandOption {
    name: string;
    description: string;
    type: number;
    required?: boolean;
}

export interface Command {
    name: string;
    description: string;
    options?: CommandOption[];

    run: (client: Client, interaction: CommandInteraction) => Promise<void>;
}
