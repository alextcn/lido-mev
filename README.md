# Lido MEV: Withdrawal NFT

On May 15, 2023, this bot successfully [seized](https://twitter.com/PsheEth/status/1658129709119557633) a one-off MEV opportunity to migrate Lido to V2 and mint the first Lido Withdrawal NFT.

## Opportunity
Upon Ethereum Shanghai and Capella [upgrades](https://ethereum.org/en/history/#shanghai), Lido [introduced](https://blog.lido.fi/lido-v2-launch/) version 2 of the protocol to support withdrawals, allowing users to unstake ETH by burning stETH. Since the number of ETH that can be staked and unstaked in each block on Ethereum is limited by design, Lido’s withdrawal mechanism is based on a queue that is implemented as an ERC-721 NFT token. To withdraw ETH from Lido, an stETH holder must request a withdrawal and receive an NFT in return, which can later be exchanged for actual ETH. These NFTs are sequentially numbered to represent positions in the queue.

The goal of this MEV was to mint Lido withdrawal NFT token #1.

## Plan
To mint the first NFT, a searcher bot must wait for the Lido V2 vote to be executed, and then send a withdrawal request transaction faster than others.

The naive approach is to monitor the public mempool for the governance proposal execution transaction made by the team, and then backrun it with the minting transaction. However, there's a flaw that a more sophisticated bot can frontrun by submitting a faster transaction to either a public mempool or via a private Flashbots transaction, resulting this bot in acquiring NFT #2 instead.

By checking Lido governance contracts, you could find that Lido governance proposal can be executed by anyone. This means that a bot can execute a governance proposal and mint the first NFT in the same Flashbots bundle. Such a bot wins any other bots using the first approach and turns network peformance competition into gas competition.

Ultimately this MEV opportunity comes down to a gas war with other bots trying to execute governance proposal and mint NFT via Flashbots in the earliest possible block.

## Code
This repository contains a smart contract and a script to execute a Flashbots transaction at the right time.

[**Lido2Life contract**](https://github.com/jackqack/lido-mev/blob/main/contract/contracts/Lido2Life.sol) features a single mint function that can be invoked by anyone to execute a governance proposal vote and mint an NFT. It was deployed and tested with Hardhat mainnet fork upfront. A contract is used instead of a Flashbots bundle with 2 transactions to avoid potential nonce collisions and preserve the ability to mint second NFT if bot gets outcompeted.

[**send.ts script**](https://github.com/jackqack/lido-mev/blob/main/src/send.ts) listens for new blocks to send `Lido2Life.mint()` transaction to multiple Flashbots builders 5 blocks prior to target block (so builders have enough time processing it). Although the target timestamp was known (`1684163759`), the block number has to be estimated to be send to Flashbots builder RPC.

[**ethers-provider-flashbots-bundle**](https://github.com/jackqack/ethers-provider-flashbots-bundle/) version used is this repository is [patched](https://github.com/jackqack/ethers-provider-flashbots-bundle/commit/39b37e3d699a3a5dd66968a6556e147c61e74f1a) to support optional `bundleHash` param in response as most builders don't use it.

## Execution

I came up with the opportunity during ETHGlobal Lisbon when Lido V2 governance proposal has already been started. I only had than 2 days left to plan, make a bot, and execute it. 

As this is a one-time opportunity and you can't practically emulate mainnet environment of Flashbots, the most challenging part was to make sure the transaction is submitted and included to the right block. Having little experience with Flashbots, I spent some time learning  docs, testing transactions, understanding gas fees and learning common mistakes. I discovered the need to send a transaction to multiple builders (which I found on Flashbots Discord). Also, I sent the transaction a few blocks in advance to ensure that builders and relays had sufficient time to process it, though I was uncertain if this was truly necessary.

You may have noticed there was a ~12% chance of block being build by a validator from public mempool, which I decided to ignore having limited time.

The script was also written in a hurry and target block calculation has a bug! I predicted it could happen and ran a script in multiple windows with different target blocks, which would've also helped with if target block was minted from public mempool.

I estimated that such a transaction would consume up to 10M gas units. By meeting with people in Lisbon, I learned that not many heard of Lido V2 and NFT-based withdrawal queue.  As this NFT did not possess any inherent value to incentivize others to compete aggressively, I decided to bid up to 3 ETH in the form of gas spent for a private transaction.

Finally, it worked. The bot successfully sniped the Lido Withdrawal NFT #1. The [transaction](https://etherscan.io/tx/0x592d68a259af899fb435da0ac08c2fd500cb423f37f1d8ce8e3120cb84186b21) cost me $3,345 and landed first in that block.

## Further reading
- https://docs.flashbots.net
- https://bertcmiller.com/2021/09/05/mev-synthetix.html
- https://www.relayscan.io
- https://mevboost.pics
- https://www.mev.to/builders
