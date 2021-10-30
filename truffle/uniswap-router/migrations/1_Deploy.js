const { initStorage, json } = require('../../../scripts/load-storage');
const log = console.log.bind(console);
let Storage;

let _deploy;
let _accounts;
module.exports = async function (deployer, network, accounts) {
  _deploy = deployer.deploy.bind(deployer);
  _accounts = accounts;
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
  
  const result = await _deploy(artifacts.require(requireArtifact), ...args, {
    from: _accounts[0],
    overwrite: true
  });
  
  log("Deployed:" + contractName, "Address:", result.address);

  Storage.contracts = { ...Storage.contracts, [name]: result.address };

  return result.address;
}