const { log, highlight, danger } = require("@mysticaldragon/logger");
const { getENSAddress, setENSOwner, getENSOwner, setENSResolver, getENSResolver, setENSAddress } = require("../scripts/load-web3");
const { ZERO_ADDRESS, ok } = require("../scripts/utils");
const { hash } = require('eth-ens-namehash');
const { sha3 } = require('web3-utils');
const { ENS_TLD } = require('../scripts/load-env');
const { initStorage, json } = require("../scripts/load-storage");

module.exports = async () => {
    await initStorage();

    const Storage = json('env');

    if(false) {//? TLD
        {//? setENSOwner & getENSOwner [TLD]
            await setENSOwner("test", Storage.ethAddress);
            const ensOwner = await getENSOwner("test");

            $ok(
                ensOwner === Storage.ethAddress,
                [`✓ [TLD] setENSOwner(url, addr)`, `✓ [TLD] getENSOwner(url)`],
                `Address mismatch (test) ${ensOwner} !== (address) ${Storage.ethAddress}`
            );
        }

        {//? setENSResolver & getENSResolver [TLD]
            await setENSResolver("test", Storage.contracts.PublicResolver);
            const ensResolver = await getENSResolver("test");

            $ok(
                ensResolver === Storage.contracts.PublicResolver,
                [`✓ [TLD] setENSResolver(url, addr)`, `✓ [TLD] getENSResolver(url)`],
                `Address mismatch (test) ${ensResolver} !== (address) ${Storage.contracts.PublicResolver}`
            );
        }

        {//? setENSResolver & getENSResolver [TLD]
            await setENSAddress("test", Storage.ethAddress);
            const ensAddress = await getENSAddress("test");

            $ok(
                ensAddress === Storage.ethAddress,
                [`✓ [TLD] setENSAddress(url, addr)`, `✓ [TLD] getENSAddress(url)`],
                `Address mismatch (test) ${ensAddress} !== (address) ${Storage.ethAddress}`
            );
        }
    }
    
    {//? Subdomains
        {//? setENSOwner & getENSOwner
            await setENSOwner("camilo.test", Storage.ethAddress);
            const ensOwner = await getENSOwner("camilo.test");

            $ok(
                ensOwner === Storage.ethAddress,
                [`✓ setENSOwner(url, addr)`, `✓ getENSOwner(url)`],
                `Address mismatch (camilo.test) ${ensOwner} !== (address) ${Storage.ethAddress}`
            );
        }

        {//? setENSResolver & getENSResolver
            await setENSResolver("camilo.test", Storage.contracts.PublicResolver);
            const ensResolver = await getENSResolver("camilo.test");

            $ok(
                ensResolver === Storage.contracts.PublicResolver,
                [`✓ setENSResolver(url, addr)`, `✓ getENSResolver(url)`],
                `Address mismatch (test) ${ensResolver} !== (address) ${Storage.contracts.PublicResolver}`
            );
        }

        {//? setENSAddress & getENSAddress
            await setENSAddress("camilo.test", Storage.ethAddress);
            const ensAddress = await getENSAddress("camilo.test");

            $ok(
                ensAddress === Storage.ethAddress,
                [`✓ setENSAddress(url, addr)`, `✓ getENSAddress(url)`],
                `Address mismatch (test) ${ensAddress} !== (address) ${Storage.ethAddress}`
            );
        }
    }
}

async function verifyDomain (name, domain) {
    const addr = Storage.contracts[name];
    const domainAddr = await getENSAddress(domain);

    return ok(addr === domainAddr, `Address mismatch (${domain}) ${domainAddr} !== (${name}) ${addr}`)
}

function $ok (check, success, failure) {
    if(check) {
        if (Array.isArray(success)) {
            success.forEach(s => log("ENS-TEST", s));
        } else log("ENS-TEST", highlight(success));
    } else {
        throw new Error(failure);
    }
}