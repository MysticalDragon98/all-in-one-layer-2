const { log, danger, highlight, cold } = require('@mysticaldragon/logger');
const { initStorage, path, json, flag } = require('./load-storage');
const { resolve } = require('path');
const { truffle } = require('./bin');
const { getSubstringProperty, wait, ZERO_ADDRESS } = require("./utils");
const { readFileSync } = require('fs');
const { initWeb3, contract, setTLDOwner, setTLDAddress, setSubdomainAddress, setTLDResolver } = require('./load-web3');
const { hash } = require('eth-ens-namehash');
const { sha3 } = require('web3-utils');
const { PASSWORD, ENS_TLD } = require('./load-env');

let Storage, web3;
async function main () {
    await initStorage();
    web3 = await initWeb3();
    Storage = json("env");

    if (!Storage.contracts) Storage.contracts = {};
    
    await ensureContract("uniswap", "UniswapV2Factory", [Storage.ethAddress]);
    await ensureContract("ens"    , "ENSRegistry", []);
    await ensureContract("ens"    , "PublicResolver", [Storage.contracts.ENSRegistry]);
    await ensureContract("ens"    , "FIFSRegistrar", [Storage.contracts.ENSRegistry, hash(ENS_TLD)]);
    await ensureContract("ens"    , "ReverseRegistrar", [Storage.contracts.ENSRegistry, Storage.contracts.PublicResolver]);
    
    if (!flag("ENS_Configured")) await configENS();
    else log("ENS", "✓ ENS already configured.")

    log("MAIN", "Contracts:", Storage.contracts);
}

async function compilePath (cwd, name) {
    try {
        return JSON.parse(readFileSync(resolve(__dirname, "../truffle/" + cwd + "/build/contracts/" + name + ".json")));
    } catch (exc) {
        if (exc.code !== "ENOENT") throw exc;
    }

    log(name, "🔨  Compiling...");

    const proc = truffle(resolve(__dirname, "../truffle/" + cwd), ['compile'])
        .on('line', line => {
            if (line.includes("Compiled successfully using")) proc.emit('done');
        });
    
    await proc.awaitEvent('done');

    log(name, "✓ Compiled successfully");
    
    await wait(500);
    return compilePath(cwd, name);
}

async function ensureContract (path, name, args) {
    if (Storage.contracts[name]){
        log(name, "✓ Already deployed");
        return Storage.contracts[name];
    } else {
        return await deploy(path, name, args);
    }
}

async function deploy (path, name, args) {
    const contractInterface = await compilePath(path, name);
    log(name, "🡅  Deploying...");
    const contract = new web3.eth.Contract(contractInterface.abi);
    const tx = contract.deploy({ data: contractInterface.bytecode, arguments: args });
    const createTx = await web3.eth.personal.signTransaction({
        from: Storage.ethAddress,
        data: tx.encodeABI(),
        gas: parseInt(await tx.estimateGas() * 1.1),
        gasPrice: 2,
        nonce: await web3.eth.getTransactionCount(Storage.ethAddress)
    }, PASSWORD);
    const receipt = await web3.eth.sendSignedTransaction(createTx.raw);

    Storage.contracts = { ...Storage.contracts, [name]: receipt.contractAddress };
    
    log(name, "✓ Deployed successfully at", highlight(receipt.contractAddress));

    return receipt.contractAddress;
}

async function configENS () {
    log("ENS", "Setting up ENS...");

    {//? Setup resolver domains
        await setTLDOwner   ("resolver" , Storage.ethAddress);
        await setTLDResolver("resolver" , Storage.contracts.PublicResolver);
        await setTLDAddress ("resolver" , Storage.contracts.PublicResolver);
    }

    {//? Setup default domains
        await setTLDOwner(ENS_TLD, Storage.ethAddress);
        await setSubdomainAddress(`uniswap.${ENS_TLD}`, Storage.contracts.UniswapV2Factory)
        await setSubdomainAddress(`ens-registry.${ENS_TLD}`, Storage.contracts.ENSRegistry)
        await setSubdomainAddress(`ens-resolver.${ENS_TLD}`, Storage.contracts.PublicResolver)
        await setSubdomainAddress(`ens-registrar.${ENS_TLD}`, Storage.contracts.FIFSRegistrar)
        await setSubdomainAddress(`ens-reverse-registrar.${ENS_TLD}`, Storage.contracts.ReverseRegistrar)
        await setSubdomainAddress(`system.${ENS_TLD}`, Storage.ethAddress)
    }

    {//? Setup reverse resolver domains
        await setTLDOwner("reverse", Storage.ethAddress);
        await setSubdomainAddress("addr.reverse", Storage.contracts.ReverseRegistrar);
    }

    log("ENS", "✓ ENS Configured successfully.");
    flag("ENS_Configured", 1);
}

main().catch(console.log);