import mongoose from "mongoose"

const StakingAccountsSchema = mongoose.model("StakingAccounts", new mongoose.Schema({
    projectId: { type: String },
    vaultId: { type: String },
    walletAddress: { type: String },
    rewardsToClaim: {type: Array}
}))
export default StakingAccountsSchema