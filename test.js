import mongoose from 'mongoose'
import config from './config.js'
import RaffleSchema from './database/raffles/rafflesSchema.js'

RaffleSchema.create(
    {
        "raffleId": "O88Lt1JW1Id/v+yGhPPEBNQ==",
        "prize": [
          {
            "type": "NFT",
            "name": "Riff Rat #111",
            "amount": 1
          }
        ],
        "description": "High quality unique art from fomo foxes in collaboration with Riff rats",
        "projectId": "fomofoxes",
        "icon": "https://media.discordapp.net/attachments/992045524779806730/1038746372117119026/0x2c611818f098fc514d754a10fb71a852be36644764067b7bc4a0b98dfaca8187.png?width=610&height=610",
        "endingAt": Date.now()+1*24*60*60*1000,
        "entryOptions": [
          {
            "type": "SOL",
            "currencyIcon": "SOL",
            "amount": 0.01
          }
        ],
        "numberOfWinners": 1,
        "maxTicketsPerWallet": Infinity,
        "__v": 0,
        "ticketPayPriceWallet": "2XKuorqTcSi8fATGNv4saJ6SBrxrVcTtTvR3FXPcPjyL"
      }
)
mongoose.connect(config.mongoUri)
    .then(() => {
        console.log('Connected to MongoDB')
    })