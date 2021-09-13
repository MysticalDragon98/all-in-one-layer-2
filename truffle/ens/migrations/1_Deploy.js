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

  const ensAddress = await deploy("@ensdomains/ens/ENSRegistry as ENSRegistry");
  await deploy("@ensdomains/ens/PublicResolver as ENSResolver", ensAddress);
  log("Done.");
};

async function deploy (name, ...args) {
  let [ requireArtifact, contractName ] = name.split(" as ");
  console.log({ requireArtifact, contractName })
  if (!contractName) contractName = requireArtifact;
  if (Storage.contracts[contractName]) {
    log("Already deployed:", contractName);
    return;
  }
  log("Deploying:", contractName);
  
  const result = await _deploy(artifacts.require(requireArtifact), ...args);

  log("Deployed:" + contractName, "Address:", result.address);

  Storage.contracts = { ...Storage.contracts, [contractName]: result.address };

  return result.address;
}