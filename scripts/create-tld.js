const { log, cold, highlight, warning, danger } = require("@mysticaldragon/logger");
const { json } = require("./load-storage");
const { initWeb3, getTLDOwner, setTLDOwner, resolveAddr, getENSOwner } = require('./load-web3');
const { ENS_TLD } = require('./load-env');
const { ok, ZERO_ADDRESS } = require("./utils");

const TLD  = process.argv[2];
const ETH_ADDRESS = process.argv[3];

if (!TLD) return log(danger("TLD name not defined."), "Usage: yarn create-tld [tld] [name]");
if (!ETH_ADDRESS) return log(danger("Destination address not defined."), "Usage: yarn create-tld [tld] [name]");

async function main () {
    const web3 = await initWeb3();
    const Storage = json('env');
    const currentOwner = await getTLDOwner(`${TLD}.${ENS_TLD}`);
    const ethAddress = await resolveAddr(ETH_ADDRESS);
    
    log("TLD", await getENSOwner("system.novax"));
    if (ethAddress !== ZERO_ADDRESS)
        ok(currentOwner === ZERO_ADDRESS, "TLD already assigned to:", currentOwner, "Set it to ZERO_ADDRESS before assigning to a new one.");

    await setTLDOwner(TLD, ethAddress);
}

main().catch(console.log)