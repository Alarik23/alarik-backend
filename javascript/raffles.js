import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js"
import RaffleEntrySchema from "../database/raffles/raffleEntrySchema.js"
import RaffleSchema from "../database/raffles/rafflesSchema.js"
import UsedTransactionsSchema from "../database/usedTransactions.js"

export const enterRaffle = async (req, res) => {
    try {
        const signature = req.body.signature
        const walletAddress = req.body.walletAddress
        const raffleId = req.body.raffleId
        let numberOfTickets = req.body.numberOfTickets
        const raffleEntryType = req.body.raffleEntryType
        if (!signature || !walletAddress || !raffleId || !numberOfTickets || !raffleEntryType) return res.json({ error: "Argument Error" })
        numberOfTickets = parseInt(numberOfTickets)
        if (isNaN(numberOfTickets)) return res.json({ error: `${numberOfTickets} cannot be number of tickets` })
        const raffle = await RaffleSchema.findOne({ raffleId: raffleId })
        if (!raffle) return res.json({ error: "Raffle not found" })
        if (raffle.endingAt < Date.now()) return res.json({ error: "Raffle Ended" })
        const raffleEntryTypeInRaffle = raffle.entryOptions.find(y => y.type === raffleEntryType)
        if (!raffleEntryType) return res.json({ error: `You cannot pay ${raffleEntryType} to enter this raffle.` })
        const alreadyUsedTransaction = await UsedTransactionsSchema.findOne({ transactionSignature: signature })
        if (alreadyUsedTransaction) return res.json({ error: "Already Used Transaction." })
        if (raffleEntryTypeInRaffle.type === "SOL") {
            const connection = new Connection('https://wider-falling-firefly.solana-mainnet.discover.quiknode.pro/9bcba0c1c16d1435fe07126ee2790a679cdd78aa/')
            let transaction = await connection.getParsedTransaction(signature, 'confirmed')
            if (!transaction) transaction = await connection.getParsedTransaction(signature, 'finalized')
            if (!transaction) return res.json({ error: `Transaction not found.` })
            const signerInTransaction = transaction.transaction.message.accountKeys.find(x => x.signer === true && x.pubkey.toString() === walletAddress)
            if (!signerInTransaction) return res.json({ error: 'Transaction Error' })
            const ticketPriceWalletInTransaction = transaction.transaction.message.accountKeys.find(x => x.signer === false && x.pubkey.toString() === raffle.ticketPayPriceWallet)
            if (!ticketPriceWalletInTransaction) return res.json({ error: 'Transaction Error: Ticket price wallet not found' })
            if (transaction.transaction.message.instructions[0].parsed.info.destination === raffle.ticketPayPriceWallet && transaction.transaction.message.instructions[0].parsed.info.source === walletAddress) {
                const amount = parseFloat((raffleEntryTypeInRaffle.amount * numberOfTickets).toFixed(10))
                const amountToLamports = parseFloat((amount * LAMPORTS_PER_SOL).toFixed(10))
                if (amountToLamports === transaction.transaction.message.instructions[0].parsed.info.lamports) {
                    const alreadyTicket = await RaffleEntrySchema.findOne({ walletAddress: walletAddress, raffleId: raffleId })
                    const sameTransactionRaffleEntries = await RaffleEntrySchema.findOne({ transactionSignature: signature })
                    console.log(sameTransactionRaffleEntries)
                    if (!sameTransactionRaffleEntries) {
                        if (alreadyTicket) {
                            if (parseInt(alreadyTicket.numberOfTickets) + parseInt(numberOfTickets) > raffle.maxTicketsPerWallet) {
                                return res.json({ error: `You cannot buy more than ${raffle.maxTicketsPerWallet} tickets` })
                            }
                            alreadyTicket.numberOfTickets += numberOfTickets
                            alreadyTicket.transactionSignature.push(signature)
                            alreadyTicket.markModified('numberOfTickets')
                            alreadyTicket.markModified('transactionSignature')
                            await alreadyTicket.save()
                            await UsedTransactionsSchema.create({ walletAddress: walletAddress, transactionSignature: signature, useType: 'raffle' })
                            return res.json({ success: `Successfully bought ${numberOfTickets} tickets`, numberOfTickets: alreadyTicket.numberOfTickets })
                        } else {
                            await UsedTransactionsSchema.create({ walletAddress: walletAddress, transactionSignature: signature, useType: 'raffle' })
                            await RaffleEntrySchema.create({ walletAddress: walletAddress, transactionSignature: [signature], numberOfTickets: numberOfTickets, raffleId: raffleId })
                            return res.json({ success: `Successfully bought ${numberOfTickets} tickets`, numberOfTickets: numberOfTickets })
                        }
                    } else {
                        return res.json({ error: `Transaction already used.` })
                    }
                } else {
                    return res.json({ error: `Transaction Error: Amount transferred was not accurate.` })
                }
            } else {
                return res.json({ error: "Transaction Error: Destination and source opposite." })
            }
        }
    } catch (err) {
        console.log(err)
        return res.json({ error: "Server Error" })
    }
}
export const checkTransaction = async (signature) => {

}
export const getRaffles = async (req, res) => {
    try {
        console.log(req.body)
        const projectId = req.body.projectId
        const walletAddress = req.body.walletAddress
        if (!projectId) return res.json({ error: "Argument Error" })
        else {
            const rafflesData = await RaffleSchema.find({ projectId: projectId })
            const raffles = []
            for (const raffle of rafflesData) {
                const raffle2 = { numberOfTickets: 0, numberOfTicketsBought: 0 }
                const raffleEntries = await RaffleEntrySchema.find({ raffleId: raffle.raffleId })
                let numberOfTickets = 0
                raffleEntries.forEach(x => {
                    numberOfTickets += x.numberOfTickets
                })
                raffle2.numberOfTickets = numberOfTickets
                if (walletAddress) {
                    const walletTickets = await RaffleEntrySchema.findOne({ raffleId: raffle.raffleId, walletAddress: walletAddress })
                    if (walletTickets) {
                        raffle2.numberOfTicketsBought = walletTickets.numberOfTickets
                    }
                }
                const raffleData = { ...raffle._doc, ...raffle2 }
                raffles.push(raffleData)
            }
            return res.json({ raffles: raffles })
        }
    } catch (err) {
        console.log(err)
        return res.json({ error: "An Unknown Error Occured" })
    }
}