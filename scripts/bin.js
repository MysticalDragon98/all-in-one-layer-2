const { log } = require('@mysticaldragon/logger');
const { exec } = require('child_process');
const kill = require('tree-kill');
const EventEmitter = require('events');
const { resolve } = require('path');
const { GETH_BIN } = require('./load-env');

const GETH_PATH = resolve(GETH_BIN, "./geth");
const PUPPETH_PATH = resolve(GETH_BIN, "./puppeth");
const TRUFFLE_PATH = resolve(__dirname, "../node_modules/.bin/truffle");

function geth (args, streamName = "stderr") {
    return createCommandLineFromCommand(GETH_PATH + " " + args.join(" "), streamName);
}

function puppeth (args, streamName = "stdout") {
    return createCommandLineFromCommand(PUPPETH_PATH + " " + args.join(" "), streamName);
}

function truffle (cwd, args, streamName="stdout") {
    return createCommandLineFromCommand(TRUFFLE_PATH + " " + args.join(" "), "stdout", cwd)
}

function createCommandLineFromCommand (command, streamName, cwd) {
    const emitter = new EventEmitter();
    const { stdout, stdin, stderr, pid } = exec(command, cwd? { cwd } : undefined);
    log("COMMAND", command);
    const stream = { stdout, stderr }[streamName];

    {//? Read lines
        stream.on('data', data => {
            const lines = data.toString().split("\n");

            for (const line of lines) {
                log("LINE", line);
                emitter.emit('line', line);
            }
        });
    }

    stream.on('error', (err) => emitter.emit('err', err));
    stream.on('end', () => emitter.emit('end'));

    emitter.writeln = (str) => stdin.write(str + "\n");
    emitter.awaitEvent = (evtName) => new Promise(success => emitter.once(evtName, success));
    emitter.end = () => kill(pid);
    emitter.stdout = stdout;
    emitter.stderr = stderr;
    emitter.stdin = stdin;

    return emitter;
}

exports.geth = geth;
exports.puppeth = puppeth;
exports.truffle = truffle;