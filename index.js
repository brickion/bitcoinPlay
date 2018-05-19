const bitcoin = require('bitcoinjs-lib')
const axios = require('axios')
const production = true
const confirmationsMin = 6
const BITCOIN_DIGITS = 8;
const BITCOIN_SAT_MULT = Math.pow(10, BITCOIN_DIGITS);
const network = bitcoin.networks.bitcoin // production ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
const blockchainInfoURL = production ? 'https://blockchain.info' : 'https://testnet.blockchain.info'

//CreateAccount()
//isTransactionSuccessful('29804e2ada8afb98b11d4ac288b5ec41cf6a789aa2251342dfec0cc16d06b51b')
//GetTransaction('29804e2ada8afb98b11d4ac288b5ec41cf6a789aa2251342dfec0cc16d06b51b')
//GetBalance('n4BFE8vKYmxgRHSxcgJ75MB4SQSbRSn8De')

send('1HbjggyRUHqLamPt4NPV4UnHeGA2pgijue', 'Kyc7YFhsf8FmktW6CiUEYZLPXUXDMs4psjbaxm2fNTgScj2vKcQv', '1DBEUHMhMpRtM3SRfotKC4KkcM881LrqS9', '0.00002')
//send('1DBEUHMhMpRtM3SRfotKC4KkcM881LrqS9', 'Kyc7YFhsf8FmktW6CiUEYZLPXUXDMs4psjbaxm2fNTgScj2vKcQv', '1DBEUHMhMpRtM3SRfotKC4KkcM881LrqS9', '0.01')
//getTrans('1DBEUHMhMpRtM3SRfotKC4KkcM881LrqS9')

async function getFees() {
  const url = 'https://bitcoinfees.earn.com/api/v1/fees/recommended'
  const res = await axios.get(url)
  return res.data.fastestFee
}

async function getTransactionSize (numInputs, numOutputs) {
	return numInputs*180 + numOutputs*34 + 10 + numInputs
}

async function getTrans(address) {
  try {
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
  catch (e) {
    return {
      error: {
        message: 'can not get transactions, ensure wallet is not empty and btc network is online',
        full_error: e
      }
    }
  }
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
  console.log('to send: ' + amtSatoshi)

  const feePerByte = await getFees()
  console.log('fee per byte: ' + feePerByte)

	const utxos = await getTrans(from)
  if (utxos.error) {
    console.log(utxos.error.message)
    process.exit()
  }
  // console.log(utxos) // previous transactions

  const tx = new bitcoin.TransactionBuilder(network)
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

  console.log('available: ' + availableSat)
  console.log('amount:' + amtSatoshi)

	if (availableSat < amtSatoshi) {
    //throw "You do not have enough"
    console.log('not enough bitcoins to send this transaction')
    process.exit()
  }

	var change = availableSat - amtSatoshi
  console.log('change: ' + change)

  var fee = await getTransactionSize(ninputs, change > 0 ? 2 : 1)*feePerByte
  console.log('fee: ' + fee)

	if (fee > amtSatoshi) {
    console.log('Amount amount must be larger than the fee.')
    process.exit()
    // throw "Amount amount must be larger than the fee."
  }
  try {
    tx.addOutput(to, amtSatoshi - fee)
    if (change > 0) tx.addOutput(from, change)
    var keyPair = bitcoin.ECPair.fromWIF(key)
    console.log(keyPair)

  	for (var i = 0; i < ninputs; i++) {
  	    tx.sign(i, keyPair)
  	}
  	var msg = tx.build().toHex()
  	console.log(msg)
  }
  catch (e) {
    console.log(e)
  }

}

function CreateAccount() {
  var keyPair = bitcoin.ECPair.makeRandom(network)
  var address = keyPair.getAddress()
  var key = keyPair.toWIF()

  console.log({address:address,key:key} )
  //var blahNew = bitcoin.ECPair.fromWIF(key) // <- works
  //console.log(blahNew)
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
