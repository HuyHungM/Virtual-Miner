import User from "../../models/User";

export async function getUser(userId: string) {
    return User.findOne({ userId });
}

export async function createUser(userId: string) {
    return User.create({ userId });
}

export async function updateBalance(
    userId: string,
    amount: number
) {
    return User.findOneAndUpdate(
        { userId },
        { $inc: { balance: amount } },
        { returnDocument: "after" }
    );
}