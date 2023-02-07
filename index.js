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
        name: 'getAuthor',
        call: 'bor_getAuthor',
        params: 1
    }]
})

async function getPrimaryValidator(blockNum){
    var proposer
    var hexBlockNum = '0x' + blockNum.toString(16)
    await axios.post(HTTPSWEB3 ,{
        jsonrpc: '2.0',
        method: 'bor_getSnapshotProposer',
        params: [hexBlockNum],
        id: 1
    }, {
        headers: {
        'Content-Type': 'application/json',
        },
    }).then((response) => {
        console.log("response: ", response)
        proposer = response.data.result
    })
    console.log("proposer: ", proposer)
    return proposer
}

const timer = ms => new Promise(res => setTimeout(res, ms))

var PrimaryValidators = new Map(); // validator that is the primary validator for a given block
var BlockProducers = new Map();  // validator that is the block producer for a given block 

async function getMiner(blockNum) {
    var hexBlockNum = '0x' + blockNum.toString(16)
    let miner = await web3.bor.getAuthor(hexBlockNum)
    return miner
}

async function main(){
    
    for(var i=startBlockNum; i<=lastBlockNum; i=i+64){
        try{

            console.log("scanning block...   ", i)

            var proposer = await getPrimaryValidator(i)
            var miner = await getMiner(i)
    
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
