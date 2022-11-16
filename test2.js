import RaffleEntrySchema from "./database/raffles/raffleEntrySchema.js";
import RaffleSchema from "./database/raffles/rafflesSchema.js";
import mongoose from 'mongoose'
import config from "./config.js";
import StakingVaultsSchema from "./database/staking/StakingVaults.js";
import crypto from 'crypto'
import mintsHashList from './mintHashlist.js'
import { Connection, PublicKey } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import MintListSchema from "./database/staking/MintList.js";
async function updateMintHashList() {
    const projectId = 'fomofoxes'
    let mints = mintsHashList.map(x => new PublicKey(x))
    mints = mints.filter(x => x)
    const connection = new Connection(config.rpcURL)
    const metaplex = new Metaplex(connection)
    const nftsData = await metaplex.nfts().findAllByMintList({ mints: mints })
    const nftsMintData = []
    var i = 0
    for (const nft of nftsData) {
        i++
        if (nft) {
            const nftJson = await metaplex.nfts().load({ metadata: nft });
            console.log(i)
            nftsMintData.push({
                projectId: projectId,
                mint: nftJson.mint.address.toString(),
                imageURL: nftJson.json.image
            })
            console.log(nftsMintData)
        }
    }
    await MintListSchema.insertMany(nftsMintData)
}
async function updateId(idToUpdate2) {
    idToUpdate2.forEach(async idToUpdate => {
        const newId = crypto.randomBytes(16).toString('hex')
        await RaffleSchema.findOneAndUpdate({ raffleId: idToUpdate }, { $set: { raffleId: newId } })
        await RaffleEntrySchema.updateMany({ raffleId: idToUpdate }, { $set: { raffleId: newId } })
    })
}
async function createStakingProject() {
    const projectId = 'fomofoxes'
    const tokenId = crypto.randomBytes(16).toString('hex')
    const stakingOptions = [
        {
            optionId: crypto.randomBytes(16).toString('hex'),
            rewards: [{ currency: 'SOL', rewardType: 'APR', amount: 17, planId: crypto.randomBytes(16).toString('hex') }, { currency: '$FOMO', type: 'token', amount: 100, tokenId: tokenId, planId: crypto.randomBytes(16).toString('hex') }],
            interval: 1 * 24 * 60 * 60 * 1000
        },
        {
            optionId: crypto.randomBytes(16).toString('hex'),
            rewards: [{ currency: 'SOL', rewardType: 'APR', amount: 20, planId: crypto.randomBytes(16).toString('hex') }, { currency: '$FOMO', type: 'token', amount: 200, tokenId: tokenId, planId: crypto.randomBytes(16).toString('hex') }],
            interval: 7 * 24 * 60 * 60 * 1000
        }
    ]
    const tokens = [
        {
            tokenId: tokenId,
            tokenAddress: 'xxx'
        }
    ]
    await StakingVaultsSchema.create({ projectId: projectId, stakingOptions: stakingOptions, tokens: tokens })
}
async function createRaffle() {
    RaffleSchema.create(
        {
            "raffleId": crypto.randomBytes(16).toString('hex'),
            "prize": [
                {
                    "type": "NFT",
                    "name": "Baby Bunny",
                    "amount": 1
                },
                {
                    "type": "Token",
                    "tokenMint": 'Eph48CXtxBZBpHQJYSgxBoa4utERMZNMR4AekFkM188E',
                    "name": "$BUFF",
                    "amount": 90
                },
                {
                    "type": "SOL",
                    "name": "Baby Bunny",
                    "amount": 1
                }
            ],
            "description": "Adult Combo",
            "projectId": "buffbunny",
            "icon": "https://media.discordapp.net/attachments/1004085886058778756/1042038706606972948/unknown.png",
            "endingAt": Date.now() + 4 * 24 * 60 * 60 * 1000,
            "entryOptions": [
                {
                    "type": "SOL",
                    "currencyIcon": "SOL",
                    "amount": 0.03
                }
            ],
            "numberOfWinners": 1,
            "maxTicketsPerWallet": Infinity,
            "ticketPayPriceWallet": "64mHedpWkzbJKhJh6Z6WWkFiTXBHtM7sXMPR2a5qFJAF"
        }
    )
}
async function endRaffle() {
    const rafflesArray = await RaffleSchema.find()
    const endedRaffles = rafflesArray.filter(y => y.endingAt < Date.now() && y.winners[0] === 'Pending')
    if (endedRaffles.length) {
        endedRaffles.forEach(async y => {
            let raffleEntryWallets = await RaffleEntrySchema.find({ raffleId: y.raffleId })
            let raffleEntriesSeparate = []
            raffleEntryWallets.forEach(x => {
                for (let i = 0; i < x.numberOfTickets; i++) {
                    raffleEntriesSeparate.push(x)
                }
            })
            let winners = [];

            if (raffleEntryWallets.length <= y.numberOfWinners) {
                winners = raffleEntryWallets.map(x => { return { walletAddress: x.walletAddress, numberOfTickets: x.numberOfTickets } })
            } else {
                for (let g = 0; g < y.numberOfWinners; g++) {
                    const winningTicket = Math.floor(Math.random() * raffleEntriesSeparate.length)
                    const winner = raffleEntriesSeparate[winningTicket]
                    if (!winners.includes(winner)) {
                        winners.push({ walletAddress: winner.walletAddress, numberOfTickets: winner.numberOfTickets })
                    } else g--
                }
            }
            y.winners = winners
            y.markModified()
            await y.save()
        })
    }
}

mongoose.connect(config.mongoUri)
    .then(() => {
        console.log('Connected to MongoDB')
    })
