import mongoose from "mongoose"

const MintListSchema = mongoose.model("MintList", new mongoose.Schema({
    projectId: { type: String },
    mint: { type: String },
    imageURL: { type: String },
    rewardPercent: { type: Number, default: 100 },
    stakingOptions: { type: Array, default: ['default'] },
    staked: { type: Object, default: { status: 'Unstaked' } }
}))
export default MintListSchema