import config from "../config.js";
import ProjectsSchema from "../database/projectsSchema.js";
import crypto from 'crypto';

export const getProjectsByOwnerAddress = async (req, res) => {
    try {
        const walletAddress = req.body.walletAddress
        const blockchain = req.body.blockchain
        if (!walletAddress || !blockchain) return res.json({ error: "Server Error" })
        const projects = await ProjectsSchema.find({ blockchain: blockchain, owner: walletAddress })
        return res.json({ projects: projects })
    } catch (err) {
        console.log(err)
        return res.json({ error: "Server Error" })
    }
}

export const createProject = async (req, res) => {
    try {
        const ownerWalletAddress = req.body.walletAddress
        const blockchain = req.body.blockchain
        if (!ownerWalletAddress || !blockchain) return res.json({ error: "Server Error" })
        const numberOfProjects = await ProjectsSchema.find({ owner: ownerWalletAddress })
        if (numberOfProjects.length > 4) return res.json({ error: "Maximum Project Limit Reached" })
        const allProjects = await ProjectsSchema.find()
        const projectsOnOtherBlockchain = allProjects.find(x => x.owner === ownerWalletAddress && x.blockchain !== blockchain)
        if (projectsOnOtherBlockchain) return res.json({ error: "Project already created on other blockchain." })
        if (!config.blockchains.includes(blockchain)) return res.json({ error: "Blockchain not supported" })
        let id = crypto.randomBytes(16).toString('base64');
        const newProject = await ProjectsSchema.create({ owner: ownerWalletAddress, blockchain: blockchain, id: id, name: `Alarik Project`, logo: config.newProjectLogo })
        return res.json({ project: newProject })
    } catch (err) {
        console.log(err)
        return res.json({ error: "An Unknown error occured" })
    }
}

export const getProject = async (req, res) => {
    try {
        if (!req.body.projectId) return res.json({ error: "Argument Error" })
        const project = await ProjectsSchema.findOne({ id: req.body.projectId })
        if (!project) return res.json({ error: "Project not found" })
        return res.json(project)
    } catch (err) {
        console.log(err)
        return res.json({ error: "An Unknown Error Occured" })
    }
}

