import type { Client } from 'discord.js';

import type {
    CombatActorStats,
    CombatResult,
    CombatStats,
} from '../../types/Combat';
import type { EnemyDef } from '../../types/Enemy';
import type { OwnedPet, Pet } from '../../types/Pet';
import {
    DEFAULT_ATTACK_SPEED,
    COMBAT_MAX_TURNS,
} from '../balance/BalanceConfig';
import { getEquippedPet, computePetStatBonus } from '../pet/PetService';

/**
 * Reusable, enemy-agnostic combat engine. Pure functions only — no DB writes,
 * no persistent battle state. Every encounter computes to a single result.
 */

/** Damage dealt by `attacker` to `defender`: never below 1. */
export function calculateDamage(
    attacker: CombatActorStats,
    defender: CombatActorStats,
): number {
    return Math.max(1, attacker.attack - defender.defense);
}

/** Builds an actor from a combat pet's base stats, scaled by pet level. */
export function getPetCombatActor(
    petDef: Pet,
    petLevel: number,
): CombatActorStats {
    const base: CombatStats = petDef.combat_stats ?? {
        attack: 1,
        health: 1,
        defense: 1,
    };

    const maxHealth = Math.max(
        1,
        Math.floor(computePetStatBonus(base.health, petLevel)),
    );

    return {
        maxHealth,
        health: maxHealth,
        attack: Math.max(
            1,
            Math.round(computePetStatBonus(base.attack, petLevel)),
        ),
        defense: Math.max(
            0,
            Math.round(computePetStatBonus(base.defense, petLevel)),
        ),
        attackSpeed: DEFAULT_ATTACK_SPEED,
    };
}

/** Builds an enemy actor from a configurable enemy definition. */
export function buildEnemyActor(enemy: EnemyDef): CombatActorStats {
    return {
        maxHealth: Math.max(1, enemy.combat_stats.health),
        health: Math.max(1, enemy.combat_stats.health),
        attack: Math.max(1, enemy.combat_stats.attack),
        defense: Math.max(0, enemy.combat_stats.defense),
        attackSpeed: enemy.combat_stats.attack_speed ?? DEFAULT_ATTACK_SPEED,
    };
}

/**
 * Resolves a fight between a pet and an enemy.
 * Both sides attack each turn (attackSpeed = strikes per turn). The fight
 * ends when either side reaches 0 health. Returns the result.
 */
export function resolveCombat(
    pet: CombatActorStats,
    enemy: CombatActorStats,
): CombatResult {
    let petHp = pet.health;
    let enemyHp = enemy.health;
    let turns = 0;

    while (petHp > 0 && enemyHp > 0 && turns < COMBAT_MAX_TURNS) {
        turns++;

        // Pet strikes the enemy (min 1 attack per turn).
        const petStrikes = Math.max(1, Math.round(pet.attackSpeed));
        for (let i = 0; i < petStrikes && enemyHp > 0; i++) {
            enemyHp = Math.max(0, enemyHp - calculateDamage(pet, enemy));
        }

        // Enemy strikes the pet.
        const enemyStrikes = Math.max(1, Math.round(enemy.attackSpeed));
        for (let i = 0; i < enemyStrikes && petHp > 0; i++) {
            petHp = Math.max(0, petHp - calculateDamage(enemy, pet));
        }
    }

    const winner = enemyHp <= 0 ? 'pet' : 'enemy';

    return {
        winner,
        petRemainingHealth: petHp,
        enemyRemainingHealth: enemyHp,
        turns,
    };
}

/**
 * Returns the player's equipped combat pet (def + owned record), or null when
 * there is no equipped pet, the equipped pet isn't combat-capable, or it lacks
 * combat stats. Only the equipped pet ever fights.
 */
export function getEquippedCombatPet(
    client: Client,
    user: any,
): { def: Pet; owned: OwnedPet } | null {
    const equipped = getEquippedPet(user);
    if (!equipped) return null;

    const def = client.resources.pets.get(equipped.petId);
    if (!def || def.combat !== true || !def.combat_stats) {
        return null;
    }

    return { def, owned: equipped };
}
