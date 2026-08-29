import { Events } from "discord.js"

export default async(client : any) => {
    client.once(Events.ClientReady, () => {
        console.log(`${client.user.username} đã online!`)
    })
}