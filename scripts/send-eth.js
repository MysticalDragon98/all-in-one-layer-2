const { log, cold, highlight, warning, danger } = require("@mysticaldragon/logger");
const { json } = require("./load-storage");
const { initWeb3 } = require('./load-web3');
const { GAS_PRICE, PASSWORD } = require('./load-env');

const ETH_ADDRESS = process.argv[2];
const ETH_AMOUNT  = process.argv[3];

if (!ETH_ADDRESS) return log(danger("Destination address not defined."), "Usage: yarn send-eth [address] [amount]");
if (!ETH_AMOUNT)  return log(danger("Ether amount not defined."), "Usage: yarn send-eth [address] [amount]");

async function main () {
    const web3 = await initWeb3();
    const Storage = json('env');

    log("MAIN", "• Sending", warning(ETH_AMOUNT + " ETH"), "to", highlight(ETH_ADDRESS));
    
    await web3.eth.personal.sendTransaction({
        from: Storage.ethAddress,
        to: ETH_ADDRESS,
        gasPrice: GAS_PRICE,
        value: web3.utils.toWei(ETH_AMOUNT, "ether")
    }, PASSWORD);

    log("MAIN", "✓ Sent", warning(ETH_AMOUNT + " ETH"), "to", highlight(ETH_ADDRESS));
}

main().catch(console.log)