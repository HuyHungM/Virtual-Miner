import type { ClientSession } from 'mongoose';

import User from '../../models/User';
import {
    PET_MAX_LEVEL,
    PET_LEVEL_SCALE_FACTOR,
} from '../balance/BalanceConfig';
import type { OwnedPet } from '../../types/Pet';

export interface PetLevelUpResult {
    petId: string;
    oldLevel: number;
    newLevel: number;
    xp: number;
    xpGained: number;
    xpRequired: number;
    levelsGained: number;
}

export function getRequiredPetXp(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
}

export function calculatePetLevel(
    level: number,
    xp: number,
): { level: number; xp: number } {
    let currentLevel = Math.max(1, level);
    let currentXp = Math.max(0, xp);

    while (
        currentLevel < PET_MAX_LEVEL &&
        currentXp >= getRequiredPetXp(currentLevel)
    ) {
        currentXp -= getRequiredPetXp(currentLevel);
        currentLevel++;
    }

    if (currentLevel >= PET_MAX_LEVEL) {
        currentXp = 0;
    }

    return { level: currentLevel, xp: currentXp };
}

export function computePetStatBonus(baseStat: number, level: number): number {
    return baseStat * (1 + (level - 1) * PET_LEVEL_SCALE_FACTOR);
}

export async function addPetXp(
    userId: string,
    amount: number,
    session?: ClientSession,
): Promise<PetLevelUpResult | null> {
    if (amount <= 0) return null;

    const user = await User.findOne({ userId }).session(session ?? null);
    if (!user || !user.equippedPet) return null;

    const owned = user.pets.find((p) => p.petId === user.equippedPet);
    if (!owned) return null;

    const oldLevel = owned.level;

    const result = calculatePetLevel(owned.level, owned.xp + amount);

    owned.level = result.level;
    owned.xp = result.xp;

    await user.save({ session });

    return {
        petId: user.equippedPet,
        oldLevel,
        newLevel: result.level,
        xp: result.xp,
        xpGained: amount,
        xpRequired:
            result.level >= PET_MAX_LEVEL ? 0 : getRequiredPetXp(result.level),
        levelsGained: result.level - oldLevel,
    };
}

export async function addPet(
    userId: string,
    petId: string,
    session?: ClientSession,
): Promise<{ owned: OwnedPet; isDuplicate: boolean; xpAwarded: number }> {
    const user = await User.findOne({ userId }).session(session ?? null);
    if (!user) throw new Error('USER_NOT_FOUND');

    const existing = user.pets.find((p) => p.petId === petId);

    if (existing) {
        const xpAwarded = 200;
        const result = calculatePetLevel(
            existing.level,
            existing.xp + xpAwarded,
        );
        existing.level = result.level;
        existing.xp = result.xp;
        await user.save({ session });
        return { owned: existing, isDuplicate: true, xpAwarded };
    }

    const newPet: OwnedPet = { petId, level: 1, xp: 0 };
    user.pets.push(newPet);
    await user.save({ session });
    return { owned: newPet, isDuplicate: false, xpAwarded: 0 };
}

export async function equipPet(
    userId: string,
    petId: string,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId, 'pets.petId': petId },
        { $set: { equippedPet: petId } },
        { returnDocument: 'after', session },
    );
}

export async function unequipPet(userId: string, session?: ClientSession) {
    return User.findOneAndUpdate(
        { userId },
        { $set: { equippedPet: null } },
        { returnDocument: 'after', session },
    );
}

export function getOwnedPet(user: any, petId: string): OwnedPet | undefined {
    return user.pets?.find((p: OwnedPet) => p.petId === petId);
}

export function isPetOwned(user: any, petId: string): boolean {
    return user.pets?.some((p: OwnedPet) => p.petId === petId) ?? false;
}

export function getEquippedPet(user: any): OwnedPet | undefined {
    if (!user.equippedPet) return undefined;
    return user.pets?.find((p: OwnedPet) => p.petId === user.equippedPet);
}
