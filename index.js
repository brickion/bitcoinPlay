var bitcoin = require('bitcoinjs-lib')
var got = require('got');

//console.log(CreateTestAccount())
GetTransaction('29804e2ada8afb98b11d4ac288b5ec41cf6a789aa2251342dfec0cc16d06b51b')

function Send(from, key, to, amount) {
  var key = bitcoin.ECKey.fromWIF(key)
  var tx = new bitcoin.TransactionBuilder();
  tx.addInput(from, amount);
  tx.addOutput(to, amount);
  tx.sign(0, key);
  console.log(tx.build().toHex());
  // POST https://blockchain.info/pushtx
  // should post to our own node
}

function CreateAccount() {
  var keyPair = bitcoin.ECPair.makeRandom()//{ network: testnet})
  var address = keyPair.getAddress()
  var key = keyPair.toWIF()
  return {
    address: address,
    key: key
  }
}

function CreateTestAccount() {
  var testnet = bitcoin.networks.testnet
  var keyPair = bitcoin.ECPair.makeRandom({ network: testnet})
  var address = keyPair.getAddress()
  var key = keyPair.toWIF()
  return {
    address: address,
    key: key
  }
}

async function GetTransaction(transactionHash) {
  const res = await got('https://testnet.blockchain.info/rawtx/' + transactionHash)
  console.log(res)
}

async function GetBalance(address) {
  const res = await got('https://testnet.blockchain.info/balance?active=' + address)
  console.log(res)
}
