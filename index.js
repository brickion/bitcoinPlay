const bitcoin = require('bitcoinjs-lib')
const axios = require('axios')
const production = false
const confirmationsMin = 6
const network = production ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
const blockchainInfoURL = production ? 'https://blockchain.info' : 'https://testnet.blockchain.info'

//console.log(CreateAccount())
isTransactionSuccessful('29804e2ada8afb98b11d4ac288b5ec41cf6a789aa2251342dfec0cc16d06b51b')
//GetTransaction('29804e2ada8afb98b11d4ac288b5ec41cf6a789aa2251342dfec0cc16d06b51b')
//GetBalance('n4BFE8vKYmxgRHSxcgJ75MB4SQSbRSn8De')

async function Send(from, key, to, amount) {
  var key = bitcoin.ECKey.fromWIF(key)
  var tx = new bitcoin.TransactionBuilder()
  tx.addInput(from, amount)
  tx.addOutput(to, amount)
  tx.sign(0, key)
  console.log(tx.build().toHex())
  const res = await axios.post(blockchainInfoURL + '/pushtx', {tx:tx.build().toHex()})
  console.log(res.data)
}

function CreateAccount() {
  var keyPair = bitcoin.ECPair.makeRandom({network: network})
  var address = keyPair.getAddress()
  var key = keyPair.toWIF()
  return {
    address: address,
    key: key
  }
}

async function GetLatestBlock() {
  const res = await axios.get(blockchainInfoURL + '/latestblock')
  console.log(res.data.height)
}

async function GetTransaction(transactionHash) {
  const res = await axios.get(blockchainInfoURL + '/rawtx/' + transactionHash)
  console.log(res.data)
}

// transaction is considered success if more than 6 confirmations
async function isTransactionSuccessful(transactionHash) {
  const latestBlock = await axios.get(blockchainInfoURL + '/latestblock')
  //console.log(latestBlock)
  const latestHeight = latestBlock.data.height
  //console.log(latestHeight)
  const transaction = await axios.get(blockchainInfoURL + '/rawtx/' + transactionHash)
  //console.log(transaction)
  const transactionHeight = transaction.data.block_height
  //console.log(transactionHeight)
  console.log((latestHeight - transactionHeight + 1) > confirmationsMin)
}

async function GetBalance(address) {
  const res = await axios.get(blockchainInfoURL + '/balance?active=' + address)
  console.log(res.data)
}
