import { Metaplex } from "@metaplex-foundation/js"
import { Connection, PublicKey } from "@solana/web3.js"
import config from "../config.js"
import MintListSchema from "../database/staking/MintList.js"
import StakingVaultsSchema from "../database/staking/StakingVaults.js"
import crypto, { sign } from 'crypto'
import NonceSchema from "../database/nonceSchema.js"
import nacl from 'tweetnacl'
import bs58 from 'bs58'
import ProjectsSchema from "../database/projectsSchema.js"

export const unstakeNft = async (req) => {
    try {
        const walletAddress = req.walletAddress
        const projectId = req.projectId
        const nonceId = req.nonceId
        const nonceSignature = req.nonceSignature
        const nftsToUnstake = req.nftsToUnstake
        if (!projectId || !walletAddress) return { error: `Argument Error` }
        const nonceVerified = await verifyNonce({ nonceId: nonceId, walletAddress: walletAddress, projectId: projectId, signature: nonceSignature })
        if (nonceVerified.nonce) return { error: `nonce error`, nonceId: nonceVerified.nonceId, nonce: nonceVerified.nonce }
        if (nonceVerified.error) return { error: `An unknown error occured` }

        const nftsInWallet = await getStakingAccountInfo({ projectId: projectId, walletAddress: walletAddress })
        if (nftsInWallet.error) return { error: `Error occured while checking your NFT` }
        const nftNotInWallet = nftsToUnstake.find(x => !nftsInWallet.stakedNfts.find(y => y.mintAddress.toString() === x))
        if (nftNotInWallet) return { error: `NFT Not found` }

        await MintListSchema.updateMany({mint: {$in: nftsToUnstake}}, {$set: {staked: {status: 'Unstaked'}}})
        return { success: `Successfully unstaked NFTs` }
    } catch(err) {
        console.log(err)
        return { error: `An unknown error occured` }
    }
}
export const stakeNft = async (req) => {
    try {
        const walletAddress = req.walletAddress
        const projectId = req.projectId
        const nonceId = req.nonceId
        const nonceSignature = req.nonceSignature
        const nftsToStake = req.nftsToStake
        const planId = req.planId
        if (!projectId || !walletAddress) return { error: `Argument Error` }
        const nonceVerified = await verifyNonce({ nonceId: nonceId, walletAddress: walletAddress, projectId: projectId, signature: nonceSignature })
        if (nonceVerified.nonce) return { error: `nonce error`, nonceId: nonceVerified.nonceId, nonce: nonceVerified.nonce }
        if (nonceVerified.error) return { error: `An unknown error occured` }

        const nftsInWallet = await getStakingAccountInfo({ projectId: projectId, walletAddress: walletAddress })
        if (nftsInWallet.error) return { error: `Error occured while checking your NFT.` }
        const nftNotInWallet = nftsToStake.find(x => !nftsInWallet.unstakedNfts.find(y => y.mintAddress.toString() === x))
        if (nftNotInWallet) return { error: `NFT Not found.` }
        const plan = await getStakePlan({ projectId: projectId, planId: planId })
        if (plan.error) return { error: plan.error }

        await MintListSchema.updateMany({ mint: { $in: nftsToStake } }, { $set: { staked: { status: 'Staked', planId: planId } } })
        return { success: `Successfully staked NFTs` }
    } catch (err) {
        console.log(err)
        return { error: `An unknown error occured` }
    }
}

export const getStakePlan = async (req) => {
    try {
        const projectId = req.projectId
        const planId = req.planId
        if (!planId || !projectId) return { error: `Argument Error` }
        const project = await StakingVaultsSchema.findOne({ projectId: projectId })
        if (!project) return { error: `Staking not enabled for project` }
        const stakeOption = project.stakingOptions.find(x => x.rewards.find(y => y.planId === planId))
        if (!stakeOption) return { error: `Option not found` }
        const plan = stakeOption.rewards.find(x => x.planId === planId)
        if (plan) return plan
    } catch {
        return { error: `An unknown error occured` }
    }
}

export const verifyNonce = async (req) => {
    try {
        const nonceId = req.nonceId
        const walletAddress = req.walletAddress
        const projectId = req.projectId
        const signature = req.signature
        if (!walletAddress || !projectId) return { error: `Argument Error` }

        const projectInfo = await ProjectsSchema.findOne({ id: projectId })
        if (!projectInfo) return { error: `No Project found` }

        const nonce = await NonceSchema.findOne({ id: nonceId, walletAddress: walletAddress, projectId: projectId })
        if (!nonceId || !nonce || nonce.createdAt + 7 * 24 * 60 * 60 * 1000 < Date.now()) {
            const newNonce = await getNonce({ walletAddress: walletAddress, projectId: projectId })
            if (newNonce.error) return { error: `Argument Error` }
            return { error: `Nonce not created`, nonce: newNonce.nonce, nonceId: newNonce.id }
        }

        if (projectInfo.blockchain === 'Solana') {
            const publicKey = new PublicKey(walletAddress)

            const verifySign = nacl.sign.detached.verify(new TextEncoder().encode(nonce.nonce), bs58.decode(signature), publicKey.toBytes())

            if (!verifySign) {
                const newNonce = await getNonce({ walletAddress: walletAddress, projectId: projectId })
                if (newNonce.error) return { error: `Argument Error` }
                return { error: `Nonce not created`, nonce: newNonce.nonce, nonceId: newNonce.id }
            } else {
                return { success: `Verification successful` }
            }
        }


    } catch (err) {
        console.log(err)
        return { error: `An unknown error occured` }
    }
}
export const getNonce = async (req, res) => {
    try {
        const walletAddress = req.walletAddress
        if (!walletAddress) return { error: `Argument Error` }
        let projectId = req.projectId
        if (!projectId) projectId = ''
        const nonce = crypto.randomBytes(16).toString('hex')
        const id = crypto.randomBytes(16).toString('hex')
        await NonceSchema.deleteMany({ walletAddress: walletAddress })
        await NonceSchema.create({ nonce: nonce, id: id, projectId: projectId, walletAddress: walletAddress })
        return { nonce: nonce, id: id }
    } catch {
        return { error: `An unknown error occured` }
    }
}

export const getStakingAccountInfo = async (req) => {
    try {
        const projectId = req.projectId
        const walletAddress = req.walletAddress
        if (!projectId) return { error: `Argument Error` }

        const stakingProjectMongo = await StakingVaultsSchema.findOne({ projectId: projectId })
        if (!stakingProjectMongo) return { error: `Staking Project not found` }
        const stakingProject = { stakingOptions: stakingProjectMongo.stakingOptions, projectId: stakingProjectMongo.projectId, tokens: stakingProjectMongo.tokens }
        const mintHashList = await MintListSchema.find({ projectId: projectId })
        stakingProject.supply = mintHashList.length
        const totalStaked = mintHashList.filter(x => x.staked.status === 'Staked')
        stakingProject.totalStaked = totalStaked.length
        if (!walletAddress) {
            stakingProject.yourNfts = 0
            stakingProject.yoursStakedNfts = 0
            return stakingProject
        }
        const connection = new Connection(config.rpcURL)
        const publicKey = new PublicKey(walletAddress)
        if (!publicKey) return { error: `Invalid Wallet Address` }
        const metaplex = new Metaplex(connection)
        const nftsInWallet = await metaplex.nfts().findAllByOwner({ owner: publicKey })
        let nftsOfCollection = nftsInWallet.filter(x => mintHashList.find(y => y.mint.toString() === x.mintAddress.toString()))
        nftsOfCollection = await Promise.all(nftsOfCollection.map(async x => {
            const nftImage = await MintListSchema.findOne({ mint: x.mintAddress })
            x.image = nftImage.imageURL
            x.stakingOptions = nftImage.stakingOptions
            return x
        }))
        const yourStaked = nftsOfCollection.filter(y => totalStaked.find(x => x.mint === y.mintAddress.toString()))
        stakingProject.yourNfts = nftsOfCollection.length
        stakingProject.yoursStakedNfts = yourStaked.length
        stakingProject.stakedNfts = yourStaked

        stakingProject.unstakedNfts = nftsOfCollection.filter(x => !yourStaked.find(y => y.mintAddress === x.mintAddress))
        stakingProject.nftsOfCollection = nftsOfCollection
        return stakingProject
    } catch (err) {
        console.log(err)
        return { error: `An unknown error occured` }
    }
}

const getNfts = async () => {

}