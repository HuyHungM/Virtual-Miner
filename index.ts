import { Client, Collection, GatewayIntentBits } from 'discord.js';

import { readdirSync } from 'fs';
import { join } from 'path';
import type { Command } from './types/Command';
import type { Biome } from './types/Biome';
import type { Pickaxe } from './types/Pickaxe';
import type { Ore } from './types/Ore';

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, Command>;
        resources: {
            biomes: Collection<string, Biome>;
            pickaxes: Collection<string, Pickaxe>;
            ores: Collection<string, Ore>;
        };
        appEmojis: Collection<string, string>;
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

const token = Bun.env.TOKEN;

if (!token) {
    throw new Error('Missing TOKEN');
}

const commands = new Collection<string, Command>();
const ores = new Collection<string, Ore>();
const biomes = new Collection<string, Biome>();
const pickaxes = new Collection<string, Pickaxe>();
client.commands = commands;
client.resources = { ores, biomes, pickaxes };

try {
    const handles = readdirSync(join('.', 'handles'));

    for (const name of handles) {
        if (!name.endsWith('.ts')) continue;

        const handle = await import(`./handles/${name}`);
        if (typeof handle.default === 'function') {
            handle.default(client);
        }
    }

    client.login(token);
} catch (error) {
    console.error(error);
}
