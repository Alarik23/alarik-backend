import mongoose from "mongoose"

const StakingVaultsSchema = mongoose.model("StakingVaults", new mongoose.Schema({
    projectId: { type: String },
    stakingOptions: { type: Array, default: [] },
    tokens: {type: Array, default: []}
}))
export default StakingVaultsSchema