import mongoose from "mongoose"

const RaffleSchema = mongoose.model("Raffles", new mongoose.Schema({
    raffleId: { type: String },
    prize: { type: Array },
    description: { type: String },
    projectId: { type: String },
    icon: { type: String },
    createdAt: { type: Number, default: new Date() },
    endingAt: { type: Number },
    entryOptions: { type: Array },
    numberOfWinners: { type: Number },
    winners: { type: Array, default: ['Pending'] },
    maxTicketsPerWallet: {type: Number},
    ticketPayPriceWallet: {type: String}
}))
export default RaffleSchema