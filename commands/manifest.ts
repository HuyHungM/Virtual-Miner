import type { Command } from '../types/Command';

import start from './start';
import biome from './biome';
import daily from './daily';
import menu from './menu';
import mine from './mine';
import pets from './pets';
import ping from './ping';
import profile from './profile';
import quest from './quest';
import sell from './sell';
import shop from './shop';

export const commands: Command[] = [
    start,
    biome,
    daily,
    menu,
    mine,
    pets,
    ping,
    profile,
    quest,
    sell,
    shop,
];
