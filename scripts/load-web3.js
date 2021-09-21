const Web3 = require('web3');
const { initStorage, json } = require('./load-storage');
const { PASSWORD } = require('./load-env');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const { default: ENS } = require('@ensdomains/ensjs');
const { hash } = require('eth-ens-namehash');
const { sha3 } = require('web3-utils');
const { ZERO_ADDRESS } = require('./utils');
const { log, highlight, cold } = require('@mysticaldragon/logger');

const ContractRoutes = {
    uniswap: ["UniswapV2Factory"],
    ens: ["ENSRegistry", "PublicResolver", "FIFSRegistrar", "ReverseRegistrar"]
};

const CachedABIS = {};

let _web3, Storage, _ens;
async function initWeb3() {
    if (_web3) return _web3;

    await initStorage();
    Storage = json('env');
    const ipc = Storage.ipc;
    
    const web3 = new Web3(new Web3.providers.IpcProvider(ipc, require('net')));
    await web3.eth.personal.unlockAccount(Storage.ethAddress, PASSWORD);

    _web3 = web3;
    if (Storage.contracts && Storage.contracts.ENSRegistry) _ens = new ENS({
        provider: web3._provider,
        ensAddress: Storage.contracts.ENSRegistry
    });

    return web3;
}

function getContractRoute (name) {
    for (const path in ContractRoutes)
        if (ContractRoutes[path].includes(name)) return path;
    
    throw new Error("Contract not found:", name);
}

function contract (name, addr) {
    const abi = CachedABIS[name] || JSON.parse(readFileSync(resolve(__dirname, "../truffle/" + getContractRoute(name) + "/build/contracts/" + name + ".json"))).abi;

    if (!Storage.contracts[name]) throw new Error("Contract is not deployed, run yarn deploy in order to do it.");
    if (!CachedABIS[name]) CachedABIS[name] = abi;

    return new _web3.eth.Contract(abi, addr || Storage.contracts[name], {
        from: Storage.ethAddress,
        gasPrice: 2
    });
}

async function ens () {
    if (_ens) return _ens;
    await initStorage();
    return _ens = new ENS({
        provider: web3._provider,
        ensAddress: Storage.contracts.ENSRegistry
    });
}

async function resolveAddr (addr) {
    if (/^0x[0-9+]$/.test(addr))
        return addr;
    
    return await getENSAddress(addr);
}

async function setENSOwner (url, addr) {
    const domain = url.includes(".")? url.substring(url.indexOf(".") + 1) : ZERO_ADDRESS;
    const subdomain = url.includes(".")? url.substring(0, url.indexOf(".")) : url;
    const domainHash = domain === ZERO_ADDRESS? domain : hash(domain);
    const subdomainHash = sha3(subdomain);

    log("ENS-DEBUG", "setOwner(" + cold(url) + ",", highlight(addr) + ")");
    //log("ENS-DEBUG", `ENSRegistry.setSubnodeOwner('${domainHash}', '${subdomainHash}', '${addr}')`);

    return await contract('ENSRegistry').methods.setSubnodeOwner(domainHash, subdomainHash, addr).send();
}

async function getENSOwner (url) {
    log("ENS-DEBUG", "getOwner(" + cold(url) +")");
    //log("ENS-DEBUG", `ENSRegistry.owner('${hash(url)}'`);
    
    return await contract('ENSRegistry').methods.owner(hash(url)).call();
}

async function setENSResolver (url, addr) {
    log("ENS-DEBUG", "setResolver(" + cold(url) + ",", highlight(addr) + ")");
    const tx = await _ens.name(url).setResolver(addr);
    return tx.wait();
}

async function getENSResolver (url) {
    log("ENS-DEBUG", "getResolver(" + cold(url) + ")");
    return await _ens.name(url).getResolver();
}

async function setENSAddress (url, addr) {
    log("ENS-DEBUG", "setAddress(" + cold(url) + ",", highlight(addr) + ")");
    
    const resolver = await getENSResolver(url);
    const resolverContract = contract("PublicResolver", resolver);

    return await resolverContract.methods.setAddr(hash(url), addr).send();
}

async function getENSAddress (url) {
    const resolver = await getENSResolver(url);
    const resolverContract = contract("PublicResolver", resolver);
    log("ENS-DEBUG", highlight(`PublicResolver<${resolver}>`), "getAddress(" + cold(url) + ")");

    return await resolverContract.methods.addr(hash(url)).call();
}

module.exports = {
    initWeb3,
    contract,
    resolveAddr,
    setENSAddress,
    getENSAddress,
    setENSResolver,
    getENSResolver,
    setENSOwner,
    getENSOwner
};