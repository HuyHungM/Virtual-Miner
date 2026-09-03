import 'dotenv/config';

import { Client, Collection, GatewayIntentBits } from 'discord.js';

import type { Command } from './types/Command';
import type { Biome } from './types/Biome';
import type { Boost } from './types/Boost';
import type { Pickaxe } from './types/Pickaxe';
import type { Ore } from './types/Ore';
import type { Pet } from './types/Pet';
import type { Charm } from './types/Charm';
import type { Potion } from './types/Potion';
import type { BackpackDef } from './types/Backpack';
import type { EnemyDef } from './types/Enemy';

import runMongoose from './handles/Mongoose';
import runResource from './handles/Resource';
import runSlashCommand from './handles/SlashCommand';
import runEvent from './handles/Event';

declare module 'discord.js' {
    interface Client {
        commands: Collection<string, Command>;
        resources: {
            biomes: Collection<string, Biome>;
            pickaxes: Collection<string, Pickaxe>;
            ores: Collection<string, Ore>;
            boosts: Collection<string, Boost>;
            pets: Collection<string, Pet>;
            charms: Collection<string, Charm>;
            potions: Collection<string, Potion>;
            backpacks: Collection<string, BackpackDef>;
            enemies: Collection<string, EnemyDef>;
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

const token = process.env.TOKEN;

if (!token) {
    throw new Error('Missing TOKEN');
}

const commands = new Collection<string, Command>();
const ores = new Collection<string, Ore>();
const biomes = new Collection<string, Biome>();
const boosts = new Collection<string, Boost>();
const pickaxes = new Collection<string, Pickaxe>();
const pets = new Collection<string, Pet>();
const charms = new Collection<string, Charm>();
const potions = new Collection<string, Potion>();
const backpacks = new Collection<string, BackpackDef>();
const enemies = new Collection<string, EnemyDef>();
client.commands = commands;
client.resources = {
    ores,
    biomes,
    pickaxes,
    boosts,
    pets,
    charms,
    potions,
    backpacks,
    enemies,
};

client.on('error', (error) => {
    console.error('Client error:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

try {
    await runMongoose();
    await runResource(client);
    await runSlashCommand(client);
    await runEvent(client);

    client.login(token);
} catch (error) {
    console.error(error);
}
