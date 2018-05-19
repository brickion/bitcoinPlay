const bitcoin = require('bitcoinjs-lib')
const axios = require('axios')
const production = false
const confirmationsMin = 6
const BITCOIN_DIGITS = 8;
const BITCOIN_SAT_MULT = Math.pow(10, BITCOIN_DIGITS);
const network = production ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
const blockchainInfoURL = production ? 'https://blockchain.info' : 'https://testnet.blockchain.info'

//console.log(CreateAccount())
//isTransactionSuccessful('29804e2ada8afb98b11d4ac288b5ec41cf6a789aa2251342dfec0cc16d06b51b')
//GetTransaction('29804e2ada8afb98b11d4ac288b5ec41cf6a789aa2251342dfec0cc16d06b51b')
//GetBalance('n4BFE8vKYmxgRHSxcgJ75MB4SQSbRSn8De')

send('n4BFE8vKYmxgRHSxcgJ75MB4SQSbRSn8De', 'cPRQxjieq3iuERazzJBmVoPkWp9JPwSf5VxDSBrQdGNKDaepEPRx', 'mkoeWmC6Y7fhoNufGTfpyWPACqSAfBJr1c', '0.01')


async function getFees() {
  const url = 'https://bitcoinfees.earn.com/api/v1/fees/recommended'
  const res = await axios.get(url)
  return res.data.fastestFee
}

async function getTransactionSize (numInputs, numOutputs) {
	return numInputs*180 + numOutputs*34 + 10 + numInputs
}

async function getTrans(address) {
  const res = await axios.get(blockchainInfoURL + '/unspent?active=' + address)
	return res.data.unspent_outputs.map(function (e) {
		return {
			txid: e.tx_hash_big_endian,
			vout: e.tx_output_n,
			satoshis: e.value,
			confirmations: e.confirmations
		}
	})
}

async function send(from, key, to, amount) {
  // var key = bitcoin.ECKey.fromWIF(key)
  // console.log(key.pub.getAddress().toString())
  // var tx = new bitcoin.TransactionBuilder()
  // tx.addInput(from, amount)
  // tx.addOutput(to, amount)
  // tx.sign(0, key)
  // console.log(tx.build().toHex())
  // //const res = await axios.post(blockchainInfoURL + '/pushtx', {tx:tx.build().toHex()})
  // //console.log(res.data)

	const amtSatoshi = Math.floor(amount*BITCOIN_SAT_MULT)
  // console.log(amtSatoshi)

  const feePerByte = await getFees()
  //console.log(feePerByte)

	const utxos = await getTrans(from)
  //console.log(utxos)

	const tx = new bitcoin.TransactionBuilder({network:network})
	var ninputs = 0
	var availableSat = 0

	for (var i = 0; i < utxos.length; i++) {
		if (utxos[i].confirmations >= 6) {
			tx.addInput(utxos[i].txid, utxos[i].vout)
			availableSat += utxos[i].satoshis
			ninputs++

			if (availableSat >= amtSatoshi) break
		}
	}

	if (availableSat < amtSatoshi) throw "You do not have enough"

	var change = availableSat - amtSatoshi
  console.log(change)

  var fee = await getTransactionSize(ninputs, change > 0 ? 2 : 1)*feePerByte
  //console.log(fee)

	if (fee > amtSatoshi) throw "Amount amount must be larger than the fee."

  console.log(amtSatoshi)

  // tx.addOutput(to, amtSatoshi - fee)
  //
  // //if (change > 0) tx.addOutput(from, change)
  //
  // var keyPair = bitcoin.ECPair.fromWIF(key)
	// for (var i = 0; i < ninputs; i++) {
	//    tx.sign(i, keyPair)
	// }
	// var msg = tx.build().toHex()
	// console.log(msg)
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
