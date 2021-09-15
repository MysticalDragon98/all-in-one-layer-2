const { log, danger } = require("@mysticaldragon/logger");
const { initStorage, json } = require("../scripts/load-storage");
const { initWeb3 } = require("../scripts/load-web3")

Memory = {};
async function main () {
    await initStorage();
    web3 = await initWeb3();
    Storage = json('env');

    await test("ens");
}

async function test (name) {
    const module = require('./' + name);

    try {
        log(name.toUpperCase(), "Running tests...");
        await module();
    } catch (exc) {
        log(name.toUpperCase(), danger(exc.message))
    }
}

main().catch(console.log);