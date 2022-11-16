import mongoose from "mongoose"

const NonceSchema = mongoose.model("Nonce", new mongoose.Schema({
    walletAddress: { type: String },
    nonce: { type: String },
    id: { type: String },
    createdAt: { type: Number, default: Date.now() },
    projectId: {type: String}
}))
export default NonceSchema