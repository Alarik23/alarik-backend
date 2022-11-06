import mongoose from "mongoose"

const UsedTransactionsSchema = mongoose.model("Used Transactions", new mongoose.Schema({
    transactionSignature: { type: String },
    usedAt: { type: Number, default: Date.now() },
    useType: { type: String },
    walletAddress: {type: String}
}))
export default UsedTransactionsSchema