import type { Client } from 'discord.js';

import InteractionCreate from './InteractionCreate';
import InteractionButton from './InteractionButton';
import Ready from './Ready';

export const events: ((client: Client) => void | Promise<void>)[] = [
    InteractionCreate,
    InteractionButton,
    Ready,
];
