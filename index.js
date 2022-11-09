import express from "express"
import mongoose from "mongoose"
import config from "./config.js"
import { createProject, getProject, getProjectsByOwnerAddress } from "./javascript/projects.js"
import cors from 'cors'
import { enterRaffle, getRaffles } from "./javascript/raffles.js"

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

app.post('/get-raffles', async (req, res) => {
    await getRaffles(req, res)
})

app.post('/enter-raffle', async (req, res) => {
    await enterRaffle(req, res)
})


app.listen('8080', () => {
    console.log("Listening to http://localhost:8080/")
})

mongoose.connect(config.mongoUri)
    .then(() => {
        console.log('Connected to MongoDB')
    })