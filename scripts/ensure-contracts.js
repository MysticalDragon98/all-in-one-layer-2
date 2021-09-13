const { log, danger, highlight, cold } = require('@mysticaldragon/logger');
const { initStorage, path, json, Storage } = require('./load-storage');
const { resolve } = require('path');
const { truffle } = require('./bin');
const { PASSWORD } = require('./load-env');
const { getSubstringProperty } = require("./utils");

async function main () {
    await initStorage();
    var Storage = json("env");

    if (!Storage.contracts) Storage.contracts = {};
    if (!Storage.contracts.UniswapV2Factory) await deployPath("uniswap");
    if (!Storage.contracts.ENSRegistry) await deployPath("ens");

    log("MAIN", "Contract addresses", Storage.contracts);
}

async function deployPath (cwd) {
    const proc = truffle(resolve(__dirname, "../truffle/" + cwd), [
        "migrate", "--network private"
    ]).on('line', line => {
        let contractName = getSubstringProperty(line, "Already deployed:");
        if (contractName) return proc.emit('already-deployed', contractName);
        
        contractName = getSubstringProperty(line, "Deploying:");
        if (contractName) return proc.emit('deploying', contractName);
        
        contractName = getSubstringProperty(line, "Deployed:");
        if (contractName) return proc.emit('deployed', ...contractName.split(" Address: "));

        if (line.trim() === "Done.") proc.emit('done');
        else if (line.includes("Couldn't connect to node on IPC")) proc.emit('err', new Error("Couldn't connect to node on IPC"));
    })
    .on('err', err => log("ERROR", danger(err.message)))
    // .on('already-deployed', (contractName) => log(contractName, "Contract already deployed."))
    .on('deploying'       , (contractName) => log(contractName,"Deploying..."))
    .on('deployed',   (contractName, addr) => log(contractName, "Deployed successfully at.", highlight(addr)));
    
    await proc.awaitEvent('done');
}

main().catch(console.log);