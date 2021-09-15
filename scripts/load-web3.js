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

function contract (name) {
    const abi = CachedABIS[name] || JSON.parse(readFileSync(resolve(__dirname, "../truffle/" + getContractRoute(name) + "/build/contracts/" + name + ".json"))).abi;

    if (!Storage.contracts[name]) throw new Error("Contract is not deployed, run yarn deploy in order to do it.");
    if (!CachedABIS[name]) CachedABIS[name] = abi;

    return new _web3.eth.Contract(abi, Storage.contracts[name], {
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

async function getENSOwner (url) {
    return await _ens.name(url).getOwner();
}

async function getENSAddress (url) {
    return await _ens.name(url).getAddress();
}

async function setTLDOwner (url, owner) {
    const ENSRegistry = contract("ENSRegistry");
    
    log("ENS", "Setting ", highlight(url), "TLD ownership to", cold(owner));
    return await ENSRegistry.methods.setSubnodeOwner(ZERO_ADDRESS, sha3(url), owner).send();
}

async function setTLDResolver (url, resolver) {
    const ENSRegistry = contract("ENSRegistry");
    
    log("ENS", "Setting ", highlight(url), "TLD resolver to", cold(resolver));
    return await ENSRegistry.methods.setResolver(hash(url), resolver).send();
}

async function setTLDAddress (url, addr) {
    const PublicResolver = contract("PublicResolver");
    
    log("ENS", "Setting ", highlight(url), "TLD address to", cold(addr));
    return await PublicResolver.methods.setAddr(hash(url), addr).send();
}

async function setSubdomainAddress (url, addr) {
    const [ subdomain, domain ] = url.split(".");
    const PublicResolver = contract("PublicResolver");
    
    log("ENS", "Setting ", highlight(url), " subdomain to ", cold(addr));
    return await PublicResolver.methods.setAddr(hash(domain), hash(subdomain), addr).send();
}

async function setSubdomainOwner (url, addr) {
    const [ subdomain, domain ] = url.split(".");
    const PublicResolver = contract("PublicResolver");
    
    return await PublicResolver.methods.setAddr(hash(domain), hash(subdomain), addr).send();
}

exports.initWeb3 = initWeb3;
exports.contract = contract;

exports.getENSAddress = getENSAddress;
exports.getENSOwner = getENSOwner;
exports.setTLDOwner = setTLDOwner;
exports.setTLDResolver = setTLDResolver;
exports.setTLDAddress = setTLDAddress;

exports.setSubdomainAddress = setSubdomainAddress;