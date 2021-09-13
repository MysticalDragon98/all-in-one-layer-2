const { log, danger, highlight, cold } = require('@mysticaldragon/logger');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const { initStorage, path, json, Storage } = require('./load-storage');
const Web3 = require('web3');
const net = require('net');

const { PASSWORD } = require('./load-env');

async function main () {
    await initStorage();
    var Storage = json("env");

    log("MAIN", "Connecting to IPC Provider", highlight(Storage.ipc));
    const web3 = new Web3(new Web3.providers.IpcProvider(Storage.ipc, net));
    const balance = await web3.eth.getBalance("0x196d6dBfd5F2103E5a8f1f632Cf435e318dC79f3");

    await web3.eth.personal.unlockAccount(Storage.ethAddress, PASSWORD)

    log("BALANCE", balance);
}

main().catch(console.log);