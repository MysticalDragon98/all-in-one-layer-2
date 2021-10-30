const { PASSWORD, NETWORK_ID, RPC_HOST, RPC_PORT } = require('../../scripts/load-env');
const { Storage } = require('../../scripts/load-storage');
const { ethAddress, ipc } = JSON.parse(Storage.readSync("json/env.json"));
const Web3 = require('web3');

module.exports = {
  networks: {
    private: {
      provider: () => {
        const web3 = new Web3(new Web3.providers.IpcProvider(ipc, require('net')));
        web3.eth.personal.unlockAccount(ethAddress, PASSWORD);

        return web3._provider;
      },
      network_id: NETWORK_ID,   // This network is yours, in the cloud.
      production: true    // Treats this network as if it was a public net. (default: false)
    }
  },

  mocha: {},

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.6.6",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 999999
        },
        evmVersion: "istanbul", 
        outputSelection: {
         "*": {
           "": [
             "ast"
           ],
           "*": [
             "evm.bytecode.object",
             "evm.deployedBytecode.object",
             "abi",
             "evm.bytecode.sourceMap",
             "evm.deployedBytecode.sourceMap",
             "metadata"
           ]
         },
       }
       }
    }
  }
};
