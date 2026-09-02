export function rollChance(percent: number): boolean {
    return Math.random() * 100 < percent;
}

export function pickRandom<T>(items: readonly T[]): T {
    return items[Math.floor(Math.random() * items.length)]!;
}

export function randomInt(min: number, max: number): number {
    return (
        min +
        Math.floor(Math.random() * (Math.floor(max) - Math.floor(min) + 1))
    );
}

export function shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        const tmp = copy[i]!;
        copy[i] = copy[j]!;
        copy[j] = tmp;
    }

    return copy;
}
