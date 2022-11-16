import express from "express"
import mongoose from "mongoose"
import config from "./config.js"
import { createProject, getProject, getProjectsByOwnerAddress } from "./javascript/projects.js"
import cors from 'cors'
import { enterRaffle, getRaffles } from "./javascript/raffles.js"
import { getStakingAccountInfo, stakeNft, unstakeNft } from "./javascript/staking.js"

const app = express()
app.use(express.json())
app.use(cors())
app.post('/get-projects', async (req, res) => {
    await getProjectsByOwnerAddress(req, res)
})

app.post('/create-project', async (req, res) => {
    await createProject(req, res)
})

app.post('/get-project', async (req, res) => {
    await getProject(req, res)
})


// Raffles 
app.post('/get-raffles', async (req, res) => {
    await getRaffles(req, res)
})

app.post('/enter-raffle', async (req, res) => {
    await enterRaffle(req, res)
})

// Staking 
app.post('/get-staking-info', async (req, res) => {
    const response = await getStakingAccountInfo(req.body)
    return res.json(response)
})
app.post('/stake-nfts', async (req, res) => {
    const response = await stakeNft(req.body)
    return res.json(response)
})
app.post('/unstake-nfts', async (req, res) => {
    console.log(req.body)
    const response = await unstakeNft(req.body)
    console.log(response)
    return res.json(response)
})
app.listen('8080', () => {
    console.log("Listening to http://localhost:8080/")
})

mongoose.connect(config.mongoUri)
    .then(() => {
        console.log('Connected to MongoDB')
    })