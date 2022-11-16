import mongoose from "mongoose"

const ProjectsSchema = mongoose.model("Projects", new mongoose.Schema({
    name: { type: String },
    id: { type: String },
    description: { type: String },
    logo: { type: String },
    blockchain: { type: String },
    createdAt: { type: Number, default: new Date() },
    owner: { type: String },
    holderVerificationEnabled: { type: Boolean, default: false },
    stakingEnabled: { type: Boolean, default: false },
    raffleEnabled: { type: Boolean, default: false }
}))
export default ProjectsSchema