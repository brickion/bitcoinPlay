const bitcoin = require('bitcoinjs-lib')
const axios = require('axios')
const production = false
const network = production ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
const blockchainInfoURL = production ? 'https://blockchain.info' : 'https://testnet.blockchain.info'

//console.log(CreateAccount())
//GetTransaction('29804e2ada8afb98b11d4ac288b5ec41cf6a789aa2251342dfec0cc16d06b51b')
//GetBalance('n4BFE8vKYmxgRHSxcgJ75MB4SQSbRSn8De')

function Send(from, key, to, amount) {
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

async function GetTransaction(transactionHash) {
  const res = await axios.get(blockchainInfoURL + '/rawtx/' + transactionHash)
  console.log(res.data)
}

async function GetBalance(address) {
  const res = await axios.get(blockchainInfoURL + '/balance?active=' + address)
  console.log(res.data)
}
