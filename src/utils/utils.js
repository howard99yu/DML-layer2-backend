import {exec} from 'child_process';

async function runBashCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                reject(err);
            }
            resolve(stdout ? stdout : stderr);
        });
    });
}

const util = {
    runBashCommand
};

export default util;