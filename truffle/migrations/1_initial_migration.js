const { log, cold, highlight } = require("@mysticaldragon/logger");
const { initStorage, json } = require('../../scripts/load-storage');
let Storage;

let _deploy;
module.exports = async function (deployer, network, accounts) {
  _deploy = deployer.deploy.bind(deployer);
  await initStorage();
  Storage = json('env');

  log("MIGRATE", "Available accounts:", Storage.ethAddress);

  if (!Storage.contracts) {
    Storage.contracts = {};
  }

  await deploy("UniswapV2Factory", Storage.ethAddress);
};

async function deploy (name, ...args) {
  if (Storage.contracts[name]) {
    log(name, "Already deployed");
    return;
  }
  log(name, "Deploying...");
  
  const result = await _deploy(artifacts.require(name), ...args);

  log(name, "Deployed at", highlight(result.address));

  Storage.contracts = { ...Storage.contracts, [name]: result.address };

  return result.address;
}