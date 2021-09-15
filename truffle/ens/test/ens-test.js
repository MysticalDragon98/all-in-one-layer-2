const ENSResolver = artifacts.require('PublicResolver');
const ENSRegistry = artifacts.require('ENSRegistry');
const { hash } = require('eth-ens-namehash');
const { sha3 } = require('web3-utils');

contract("ENSResolver", accounts => {
    it ("Should register resolver in ENS registry contract", () => {
        const ensRegistry = await ENSRegistry.deployed();
        const ensResolver = await ENSResolver.deployed();

        const name = "resolver-test";
        const resolverNode = hash(name);
        const resolverLabel = sha3(name)
    })
})