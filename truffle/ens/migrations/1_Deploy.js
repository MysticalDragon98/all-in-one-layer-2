const { initStorage, json } = require('../../../scripts/load-storage');
const { ENS_TLD } = require('../../../scripts/load-env');
const { hash } = require('eth-ens-namehash');
const { sha3 } = require('web3-utils');
const log = console.log.bind(console);
let Storage;

let _deploy;
let _accounts = [];
module.exports = async function (deployer, network, accounts) {
  _deploy = deployer.deploy.bind(deployer);
  _accounts = accounts;
  await initStorage();
  Storage = json('env');

  if (!Storage.contracts) {
    Storage.contracts = {};
  }

  const ensAddress = await deploy("ENSRegistry");
  const resolverAddress = await deploy("PublicResolver as ENSResolver", ensAddress);
  const registrarAddress = await deploy("FIFSRegistrar", ensAddress, hash(ENS_TLD));
  const reverseRegistrarAddress = await deploy("ReverseRegistrar", ensAddress, resolverAddress);
    
  const registryContract = await deployed("ENSRegistry");
  const resolverContract = await deployed("PublicResolver");
  const registrarContract = await deployed("FIFSRegistrar");
  
  {//? Configure resolver
    const resolverNode = hash("resolver");
    const resolverLabel = sha3("resolver");
    log("Configuring resolver name");
    
    await registryContract.setSubnodeOwner("0x0000000000000000000000000000000000000000", resolverLabel, accounts[0]);
    await registryContract.setResolver(resolverNode, resolverAddress);
    await resolverContract.setAddr(resolverNode, resolverAddress);
  }

  {//? Configure registrar
    await registryContract.setSubnodeOwner("0x0000000000000000000000000000000000000000", sha3(ENS_TLD), registrarAddress);
    await registryContract.setSubnodeOwner(hash("reverse"), sha3("addr"), reverseRegistrarAddress);
  }

  log("Done.");
};

async function deploy (name, ...args) {
  let [ requireArtifact, contractName ] = name.split(" as ");
  
  if (!contractName) contractName = requireArtifact;
  if (Storage.contracts[contractName]) {
    log("Already deployed:", contractName);
    return Storage.contracts[contractName];
  }
  log("Deploying:", contractName);
  
  const result = await _deploy(artifacts.require(requireArtifact), ...args, {
    from: _accounts[0],
    overwrite: true
  });

  log("Deployed:" + contractName, "Address:", result.address);

  Storage.contracts = { ...Storage.contracts, [contractName]: result.address };

  return result.address;
}

async function deployed (name) {
  return artifacts.require(name).deployed();
}