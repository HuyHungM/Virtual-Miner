export interface Biome {
    name: string;
    id: string;
    minimum_pickaxe: string;
    description: string;
    emoji: string;
    unlock_level: number;
    /** Base mining cooldown in seconds. Falls back to DEFAULT_BIOME_COOLDOWN. */
    cooldown?: number;
}
