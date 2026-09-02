import type { ButtonRoute } from '../types';
import { shopNavigationRoutes } from './navigation';
import { pickaxeRoutes } from './pickaxe';
import { boostRoutes } from './boosts';
import { backpackRoutes } from './backpack';
import { upgradeRoutes } from './upgrades';

export const shopRoutes: ButtonRoute[] = [
    ...shopNavigationRoutes,
    ...pickaxeRoutes,
    ...boostRoutes,
    ...backpackRoutes,
    ...upgradeRoutes,
];
