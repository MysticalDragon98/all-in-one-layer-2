const { log, danger, highlight, configureLogs, cold } = require('@mysticaldragon/logger');
const { PASSWORD, NETWORK_NAME, BLOCK_INTERVAL, NETWORK_ID } = require('./load-env');
const { initStorage, path, json } = require('./load-storage');
const { getSubstringProperty } = require('./utils');
const { geth, puppeth } = require('./bin');
const { resolve, join } = require('path');
const fs = require("fs");

async function main () {
    {//? Initialize storage
        await initStorage(["geth", "geth/datadir", "geth/puppeth"]);

        var Storage = json('env');
    }

    {// ? Initialize accounts
        {//? Starting geth
            log("GETH", "Initializing accounts...");
            var gethProcess = geth([
                "--datadir", path("geth/datadir"),
                "account new"
            ], 'stdout');
        }
    
        {//? Listen Events
            gethProcess.on('line', (line) => {
                if (getSubstringProperty(line, "Password:") || getSubstringProperty(line, "Repeat password:"))
                    gethProcess.writeln(PASSWORD);

                const publicAddress = getSubstringProperty(line, 'Public address of the key:   ');
                if (publicAddress) return gethProcess.emit('address', publicAddress);
                
                const keyfile = getSubstringProperty(line, 'Path of the secret key file: ');
                if (keyfile) return gethProcess.emit('keyfile', keyfile);
            });
        }

        {//? Property Events
            gethProcess.on('address', address => {
                log("GETH", "New account generated:", cold(address));

                if (Storage.ethAddress) {
                    log("GETH", danger("There is already another address registered in this storage, the previous address will be moved to the backup_ethAddress field."));

                    Storage.backup_ethAddress = address;
                }

                Storage.ethAddress = address;
            });

            gethProcess.on('keyfile', keyfile => {
                log("GETH", "Keyfile generated:", highlight(keyfile));

                if (Storage.keyfile) {
                    log("GETH", danger("There is already another keyfile registered in this storage, the previous keyfile will be moved to the backup_keyfile field."));

                    Storage.backup_keyfile = keyfile;
                }

                Storage.keyfile = keyfile;
            })
        }

        await gethProcess.awaitEvent("keyfile");

        log("GETH", "Done!");
    }

    {//? Generate keyfiles
        log("PUPPETH", "Starting puppeth...");
        cleanPuppeth();
        const puppethProcess = puppeth([
            path("data/puppeth/genesis.json")
        ]);

        puppethProcess.on('line', line => {
            if (getSubstringProperty(line, "Please specify a network name to administer"))
                puppethProcess.writeln(NETWORK_NAME);
            else if (getSubstringProperty(line, "What would you like to do? (default = stats"))
                puppethProcess.writeln("2");
            else if (getSubstringProperty(line, "What would you like to do? (default = create"))
                puppethProcess.writeln("1");
            else if (getSubstringProperty(line, "Which consensus engine to use?"))
                puppethProcess.writeln("2");
            else if (getSubstringProperty(line, "How many seconds should blocks take?"))
                puppethProcess.writeln(BLOCK_INTERVAL);
            else if (getSubstringProperty(line, "Which accounts are allowed to seal?"))
                puppethProcess.writeln(Storage.ethAddress.substring(2) + "\n");
            else if (getSubstringProperty(line, "Which accounts should be pre-funded?"))
                puppethProcess.writeln(Storage.ethAddress.substring(2) + "\n");
            else if (getSubstringProperty(line, "Should the precompile-addresses (0x1 .. 0xff) be pre-funded with 1 wei?"))
                puppethProcess.writeln("yes");
            else if (getSubstringProperty(line, "Specify your chain/network ID if you want an explicit one (default = random"))
                puppethProcess.writeln(NETWORK_ID);
            else if (getSubstringProperty(line, "Configured new genesis block")) {
                setTimeout(() => {
                    const filePath = resolve(__dirname, "../.puppeth/coraline");
                    const genesis = JSON.parse(fs.readFileSync(filePath));
    
                    log("PUPPETH", "Genesis generated!");
    
                    cleanPuppeth();
    
                    puppethProcess.emit('genesis', genesis.genesis);
                    puppethProcess.end();
                }, 500);
            }
        });

        puppethProcess.on('genesis', genesis => {
            fs.writeFileSync(path("geth/puppeth/genesis.json"), JSON.stringify(genesis, null, 2));

            log("PUPPETH", "Genesis file stored at ./data/geth/puppeth/genesis.json");
        })

        await puppethProcess.awaitEvent("genesis");
    }

    {//? Initialize Geth network
        var gethNodeProcess = geth([
            "--datadir", path("geth/datadir"),
            "init", path("geth/puppeth/genesis.json")
        ], 'stdout');

        await gethNodeProcess.awaitEvent('end');
        
        log("GETH", "Geth network initialized.");
    }

    log("MAIN", "You are ready to go 😎 use yarn run-geth to start the node!");
}

function cleanPuppeth () {
    const puppethDir = resolve(__dirname, "../.puppeth");
    if (!fs.existsSync(puppethDir)) return;

    log("PUPPETH", "Cleaning puppeth temp files...")

    const files = fs.readdirSync(puppethDir);

    for (const file of files) {
        fs.unlinkSync(join(puppethDir, file));
    }

    fs.rmdirSync(puppethDir);
        
}

main().catch(console.log);