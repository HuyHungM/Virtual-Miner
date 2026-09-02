import { REST, Routes, type Client } from 'discord.js';

import type { CommandOption } from '../types/Command';
import { commands } from '../commands/manifest';

interface Commands {
    name: string;
    description: string;
    options?: CommandOption[];
}

const token = process.env.TOKEN;
const client_id = process.env.CLIENT_ID;

if (!token) {
    throw new Error('Missing TOKEN');
}

if (!client_id) {
    throw new Error('Missing CLIENT_ID');
}

export default async (client: Client) => {
    const commandBodies: Commands[] = [];

    for (const data of commands) {
        if (!data) continue;

        client.commands.set(data.name, data);
        commandBodies.push({
            name: data.name,
            description: data.description,
            options: data.options,
        });
        console.log(`[SLASH COMMAND] Đã tải ${data.name}`);
    }

    const rest = new REST({
        version: '10',
    }).setToken(token);
    await rest.put(Routes.applicationCommands(client_id), {
        body: commandBodies,
    });

    console.log(`[SLASH COMMAND] Đã tải ${commandBodies.length} lệnh`);
};
