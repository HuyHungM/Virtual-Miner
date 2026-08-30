import { REST, Routes, type Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

interface Commands {
    name: string;
    description: string;
}

const token = Bun.env.TOKEN;
const client_id = Bun.env.CLIENT_ID;

if (!token) {
    throw new Error('Missing TOKEN');
}

if (!client_id) {
    throw new Error('Missing CLIENT_ID');
}

export default async (client: Client) => {
    const commands: Commands[] = [];

    const files = readdirSync(join('.', '.', 'commands'));

    for (const name of files) {
        if (!name.endsWith('.ts')) continue;

        const command = await import(`../commands/${name}`);

        const data = command.default;
        if (!data) continue;

        client.commands.set(data.name, data);
        commands.push({ name: data.name, description: data.description });
        console.log(`[SLASH COMMAND] Đã tải ${name}`);
    }

    const rest = new REST({
        version: '10',
    }).setToken(token);
    await rest.put(Routes.applicationCommands(client_id), {
        body: commands,
    });

    console.log(`[SLASH COMMAND] Đã tải ${commands.length} lệnh`);
};
