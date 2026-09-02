import type { Biome } from '../types/Biome';
import type { Boost } from '../types/Boost';
import type { Ore } from '../types/Ore';
import type { Pickaxe } from '../types/Pickaxe';
import type { Pet } from '../types/Pet';
import type { Charm } from '../types/Charm';
import type { Potion } from '../types/Potion';
import type { BackpackDef } from '../types/Backpack';
import type { EnemyDef } from '../types/Enemy';

import ancient_forest from './biomes/ancient_forest';
import gem_highlands from './biomes/gem_highlands';
import legendary_abyss from './biomes/legendary_abyss';
import plains from './biomes/plains';
import volcano_core from './biomes/volcano_core';

import chest_chance_boost from './boosts/chest_chance_boost';
import chest_chance_boost_10 from './boosts/chest_chance_boost_10';
import chest_quality_boost from './boosts/chest_quality_boost';
import chest_quality_boost_10 from './boosts/chest_quality_boost_10';
import effective_boost from './boosts/effective_boost';
import effective_boost_10 from './boosts/effective_boost_10';
import fortune_boost from './boosts/fortune_boost';
import fortune_boost_10 from './boosts/fortune_boost_10';

import chest_chance_charm from './charms/chest_chance_charm';
import chest_quality_charm from './charms/chest_quality_charm';
import effective_charm from './charms/effective_charm';
import fortune_charm from './charms/fortune_charm';
import sell_charm from './charms/sell_charm';
import xp_charm from './charms/xp_charm';

import piglin from './enemies/piglin';
import piglin_brute from './enemies/piglin_brute';

import adamant from './ores/adamant';
import coal from './ores/coal';
import dirt from './ores/dirt';
import glorite from './ores/glorite';
import grass_block from './ores/grass_block';
import jade from './ores/jade';
import mithril from './ores/mithril';
import nelvarian from './ores/nelvarian';
import netherite from './ores/netherite';
import obsidian from './ores/obsidian';
import opal from './ores/opal';
import quartz from './ores/quartz';
import redstone from './ores/redstone';
import ruby from './ores/ruby';
import sand from './ores/sand';
import stone from './ores/stone';
import sunite from './ores/sunite';
import titanium from './ores/titanium';
import topaz from './ores/topaz';
import turquoise from './ores/turquoise';

import bee from './pets/bee';
import blaze from './pets/blaze';
import cat from './pets/cat';
import chicken from './pets/chicken';
import cow from './pets/cow';
import creeper from './pets/creeper';
import enderman from './pets/enderman';
import ender_dragon from './pets/ender_dragon';
import fox from './pets/fox';
import pig from './pets/pig';
import sheep from './pets/sheep';
import skeleton from './pets/skeleton';
import spider from './pets/spider';
import warden from './pets/warden';
import wither from './pets/wither';
import wither_skeleton from './pets/wither_skeleton';
import wolf from './pets/wolf';
import zombie from './pets/zombie';

import adamant_pickaxe from './pickaxes/adamant_pickaxe';
import amethyst_pickaxe from './pickaxes/amethyst_pickaxe';
import aquamarine_pickaxe from './pickaxes/aquamarine_pickaxe';
import coal_pickaxe from './pickaxes/coal_pickaxe';
import copper_pickaxe from './pickaxes/copper_pickaxe';
import diamond_pickaxe from './pickaxes/diamond_pickaxe';
import emerald_pickaxe from './pickaxes/emerald_pickaxe';
import glorite_pickaxe from './pickaxes/glorite_pickaxe';
import golden_pickaxe from './pickaxes/golden_pickaxe';
import iron_pickaxe from './pickaxes/iron_pickaxe';
import lapis_pickaxe from './pickaxes/lapis_pickaxe';
import lava_pickaxe from './pickaxes/lava_pickaxe';
import mithril_pickaxe from './pickaxes/mithril_pickaxe';
import nelvarian_pickaxe from './pickaxes/nelvarian_pickaxe';
import netherite_pickaxe from './pickaxes/netherite_pickaxe';
import obsidian_pickaxe from './pickaxes/obsidian_pickaxe';
import quartz_pickaxe from './pickaxes/quartz_pickaxe';
import redstone_pickaxe from './pickaxes/redstone_pickaxe';
import ruby_pickaxe from './pickaxes/ruby_pickaxe';
import sapphire_pickaxe from './pickaxes/sapphire_pickaxe';
import stone_pickaxe from './pickaxes/stone_pickaxe';
import sunite_pickaxe from './pickaxes/sunite_pickaxe';
import titanium_pickaxe from './pickaxes/titanium_pickaxe';
import topaz_pickaxe from './pickaxes/topaz_pickaxe';
import verdite_pickaxe from './pickaxes/verdite_pickaxe';
import withergate_pickaxe from './pickaxes/withergate_pickaxe';
import wooden_pickaxe from './pickaxes/wooden_pickaxe';

import milk from './potions/milk';
import resist_potion from './potions/resist_potion';

import ancient_forest_backpack_1 from './backpacks/ancient_forest_backpack_1';
import ancient_forest_backpack_2 from './backpacks/ancient_forest_backpack_2';
import ancient_forest_backpack_3 from './backpacks/ancient_forest_backpack_3';
import ancient_forest_backpack_4 from './backpacks/ancient_forest_backpack_4';
import gem_highlands_backpack_1 from './backpacks/gem_highlands_backpack_1';
import gem_highlands_backpack_2 from './backpacks/gem_highlands_backpack_2';
import gem_highlands_backpack_3 from './backpacks/gem_highlands_backpack_3';
import gem_highlands_backpack_4 from './backpacks/gem_highlands_backpack_4';
import hell_core_backpack_1 from './backpacks/hell_core_backpack_1';
import hell_core_backpack_2 from './backpacks/hell_core_backpack_2';
import hell_core_backpack_3 from './backpacks/hell_core_backpack_3';
import hell_core_backpack_4 from './backpacks/hell_core_backpack_4';
import legendary_abyss_backpack_1 from './backpacks/legendary_abyss_backpack_1';
import legendary_abyss_backpack_2 from './backpacks/legendary_abyss_backpack_2';
import legendary_abyss_backpack_3 from './backpacks/legendary_abyss_backpack_3';
import legendary_abyss_backpack_4 from './backpacks/legendary_abyss_backpack_4';
import plains_backpack_1 from './backpacks/plains_backpack_1';
import plains_backpack_2 from './backpacks/plains_backpack_2';
import plains_backpack_3 from './backpacks/plains_backpack_3';
import plains_backpack_4 from './backpacks/plains_backpack_4';

export const resources = {
    biomes: [
        plains,
        ancient_forest,
        gem_highlands,
        volcano_core,
        legendary_abyss,
    ] as Biome[],
    boosts: [
        effective_boost,
        effective_boost_10,
        fortune_boost,
        fortune_boost_10,
        chest_quality_boost,
        chest_quality_boost_10,
        chest_chance_boost,
        chest_chance_boost_10,
    ] as Boost[],
    charms: [
        effective_charm,
        fortune_charm,
        chest_quality_charm,
        chest_chance_charm,
        sell_charm,
        xp_charm,
    ] as Charm[],
    enemies: [piglin, piglin_brute] as EnemyDef[],
    ores: [
        stone,
        dirt,
        sand,
        coal,
        quartz,
        redstone,
        topaz,
        ruby,
        opal,
        jade,
        adamant,
        mithril,
        titanium,
        obsidian,
        netherite,
        turquoise,
        sunite,
        glorite,
        nelvarian,
        grass_block,
    ] as Ore[],
    pets: [
        chicken,
        cow,
        pig,
        sheep,
        wolf,
        cat,
        fox,
        bee,
        zombie,
        skeleton,
        spider,
        creeper,
        blaze,
        enderman,
        wither_skeleton,
        warden,
        wither,
        ender_dragon,
    ] as Pet[],
    pickaxes: [
        wooden_pickaxe,
        stone_pickaxe,
        coal_pickaxe,
        copper_pickaxe,
        iron_pickaxe,
        lapis_pickaxe,
        quartz_pickaxe,
        redstone_pickaxe,
        golden_pickaxe,
        amethyst_pickaxe,
        sapphire_pickaxe,
        emerald_pickaxe,
        aquamarine_pickaxe,
        diamond_pickaxe,
        obsidian_pickaxe,
        topaz_pickaxe,
        ruby_pickaxe,
        titanium_pickaxe,
        mithril_pickaxe,
        netherite_pickaxe,
        adamant_pickaxe,
        sunite_pickaxe,
        glorite_pickaxe,
        verdite_pickaxe,
        nelvarian_pickaxe,
        lava_pickaxe,
        withergate_pickaxe,
    ] as Pickaxe[],
    potions: [milk, resist_potion] as Potion[],
    backpacks: [
        plains_backpack_1,
        plains_backpack_2,
        plains_backpack_3,
        plains_backpack_4,
        ancient_forest_backpack_1,
        ancient_forest_backpack_2,
        ancient_forest_backpack_3,
        ancient_forest_backpack_4,
        gem_highlands_backpack_1,
        gem_highlands_backpack_2,
        gem_highlands_backpack_3,
        gem_highlands_backpack_4,
        hell_core_backpack_1,
        hell_core_backpack_2,
        hell_core_backpack_3,
        hell_core_backpack_4,
        legendary_abyss_backpack_1,
        legendary_abyss_backpack_2,
        legendary_abyss_backpack_3,
        legendary_abyss_backpack_4,
    ] as BackpackDef[],
};
