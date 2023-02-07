const axios = require('axios')
const Web3 = require('web3');
const fs = require('fs');

// START : values to change

var HTTPSWEB3 = 'http://localhost:8545'
var startBlockNum =  39018842
var lastBlockNum =  39019042

// END : values to change

var web3 = new Web3(Web3.givenProvider || HTTPSWEB3);

web3.extend({
    property: 'bor',
    methods: [{
        name: 'getSnapshotProposerSequence',
        call: 'bor_getSnapshotProposerSequence',
        params: 1
    },]
})

const timer = ms => new Promise(res => setTimeout(res, ms))

var PrimaryValidators = new Map(); // validator that is the primary validator for a given block
var BlockProducers = new Map();  // validator that is the block producer for a given block 

async function getSnapshotDetails(blockNum) {
    var hexBlockNum = '0x' + blockNum.toString(16)
    let response = await web3.bor.getSnapshotProposerSequence(hexBlockNum)
    let proposer = response.Signers[0].Signer
    let miner = response.Author
    return [proposer, miner]
}

async function main(){
    
    for(var i=startBlockNum; i<=lastBlockNum; i=i+1){
        try{

            console.log("scanning block...   ", i)

            var [proposer,miner] = await getSnapshotDetails(i)
    
            PrimaryValidators.set(i, proposer)
            BlockProducers.set(i, miner)
        }catch(e){
            console.log(e)
        }
       
    }

    let now = Math.floor(new Date().getTime() / 1000)

    await fs.appendFile(`./output/out-${now}.csv`, `BlockNumber, BlockMiner, PrimaryValidator`, function (err) {
        if (err) throw err;
        console.log('Created output file : ' + `./output/out-${now}.csv`);
    });

    await timer(1000)

    for (var [key, value] of BlockProducers.entries()) {
        await fs.appendFile(`./output/out-${now}.csv`, `\n${key}, ${value}, ${PrimaryValidators.get(key)}`, function (err) {
            if (err) throw err;

        });
    }
    
}

main()
