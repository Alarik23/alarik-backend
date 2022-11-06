import mongoose from "mongoose"

const RaffleEntrySchema = mongoose.model("Raffle Entries", new mongoose.Schema({
    raffleId: { type: String },
    walletAddress: {type: String},
    numberOfTickets: {type: Number},
    transactionSignature: {type: Array}
}))
export default RaffleEntrySchema