const { initStorage, json } = require('../../../scripts/load-storage');
const log = console.log.bind(console);
let Storage;

let _deploy;
module.exports = async function (deployer, network, accounts) {
  _deploy = deployer.deploy.bind(deployer);
  await initStorage();
  Storage = json('env');

  if (!Storage.contracts) {
    Storage.contracts = {};
  }

  await deploy("UniswapV2Factory", Storage.ethAddress);
  log("Done.");
};

async function deploy (name, ...args) {
  let [ requireArtifact, contractName ] = name.split(" as ");
  
  if (!contractName) contractName = requireArtifact;

  if (Storage.contracts[name]) {
    log("Already deployed:", contractName)
    return;
  }

  log("Deploying:", contractName);
  
  const result = await _deploy(artifacts.require(requireArtifact), ...args);
  log("Deployed:" + contractName, "Address:", result.address);

  Storage.contracts = { ...Storage.contracts, [name]: result.address };

  return result.address;
}