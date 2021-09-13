const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry');

contract("ENSRegistry", accounts => {
    it("Should create an ens domain", async accounts => {
        const name = "testing";
        const instance = await ENSRegistry.deployed();
    });
})