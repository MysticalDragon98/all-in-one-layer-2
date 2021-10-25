const { log, danger, highlight, cold } = require('@mysticaldragon/logger');
const { geth } = require('./bin');
const { initStorage, path, json } = require('./load-storage');
const { getSubstringProperty } = require('./utils');

require('./load-env');

const { PORT, RPC_PORT, RPC_HOST, RPC_CORS, MAX_PEERS, NETWORK_ID, PASSWORD } = process.env;

async function main () {
    {//? Initialize storage
        log("MAIN", "Initializing storage...");
        await initStorage(["geth", "geth/datadir", "logs"]);
        var Storage = json("env");
    }

    {//? Starting geth
        log("MAIN", "Starting geth...");
        var gethProcess = geth([
            "--datadir", path("geth/datadir"),
            "--port", PORT,
            "--http",
            "--http.corsdomain", RPC_CORS,
            "--http.addr", RPC_HOST,
            "--http.port", RPC_PORT,
            "--maxpeers", MAX_PEERS,
            "--networkid", NETWORK_ID,
            "--http.api", "eth,net,web3,personal,miner",
            "--allow-insecure-unlock",
            "--http.vhosts=*",
            "console"
        ]);
    }

    log("MAIN", "Ethereum address:", cold(Storage.ethAddress));

    {//? Listen to events
        gethProcess.on('line', line => {
            const enode = getSubstringProperty(line, "Started P2P networking                   self=");
            if (enode) return gethProcess.emit('enode', enode);

            const ipc = getSubstringProperty(line, "IPC endpoint opened                      url=");
            if (ipc) return gethProcess.emit('ipc', ipc);

            const minedBlock = getSubstringProperty(line, "mined potential block                  number=");

            if (minedBlock)
                return gethProcess.emit('block-mined', +minedBlock.substring(0, minedBlock.indexOf(" ")));
            
        });

        gethProcess.on('enode', enode => {
            log("GETH", "Node listening at", highlight(enode));
            Storage.enode = enode;
        });

        gethProcess.on('ipc', ipc => {
            log("GETH", "IPC listening at", highlight(ipc));

            Storage.ipc = ipc;
        });

        await gethProcess.awaitEvent("ipc");
    }

    {//? Attach to process
        var gethConsole = geth(["attach", Storage.ipc], "stdout");

        gethConsole.writeln(`personal.unlockAccount("${Storage.ethAddress}", "${PASSWORD}", 0)`)
        gethConsole.writeln("miner.start()");
        
        log("MINER", "Miner started.");

        //gethConsole.stdout.pipe(process.stdout);
        process.stdin.pipe(gethConsole.stdin);
    }

    {//? Miner events
        gethProcess.on('block-mined', blockNumber => {
            log("MINER", "Block", highlight("#" + blockNumber), "mined");
        });
    }
}

main().catch(console.log);