const { log, highlight } = require("@mysticaldragon/logger");
const { contract, getENSOwner } = require("../scripts/load-web3");
const { ZERO_ADDRESS } = require("../scripts/utils");
const { hash } = require('eth-ens-namehash');
const { sha3 } = require('web3-utils');
const { ENS_TLD } = require('../scripts/load-env');

module.exports = async () => {
    log("ENS", "Result:", await getENSOwner("uniswap.novax"));
}
