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

async function transfer(web3, sender, recipient, contract, amount) {
    try {
      // Get the number of tokens to transfer (convert from wei to token decimals)
      const tokenCrt = new web3.eth.Contract(TokenABI.abi, contract);
      const tokenDecimals = await tokenCrt.methods.decimals().call();
      amount = amount * Math.pow(10, tokenDecimals);
      amount = BigNumber(amount);
  
      // Transfer tokens from the owner's account to the recipient
      const gasPrice = await web3.eth.getGasPrice();
      const gasLimit = 150000;
      const nonce = await web3.eth.getTransactionCount(sender.address, 'latest');
  
      const txObject = {
        gasLimit: Web3.utils.toHex(gasLimit),
        gasPrice: Web3.utils.toHex(gasPrice),
        from: sender.address,
        to: recipient,
        nonce: nonce,
        data: tokenCrt.methods.transfer(recipient, amount).encodeABI(),
      };
  
      // Sign and send the transaction
      const signedTx = await web3.eth.accounts.signTransaction(txObject, sender.privateKey);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  
      console.log(`Tokens transferred successfully: ${receipt}`);
    } catch (error) {
      console.error('Error transferring tokens:', error);
    }
}

async function getFileSize(filePath) { 
    const stats = fs.statSync(filePath);
    if(stats.isFile()) {
      const size = stats.size;
      console.log(`${fileName} size: ${Math.round(size/1024)} KB`);
      return Math.round(size/1024)
    }
    return "File not found"
}

async function payByFile(web3, sender, recipient, contract, filesize){
    let amount = filesize * 0.0001;
    console.log(`Amount to be paid: ${amount} tokens`);
    const result = await transfer(web3, sender, recipient, contract, amount);
    console.log(result);
}

async function getTotalReward(web3, transactionHash){
  const transaction = await web3.eth.getTransactionReceipt(transactionHash);
  console.log(transaction.logs[0]);
  const tokenValue = new BigNumber(transaction.logs[0].data).dividedBy('1e18').toNumber();
  console.log(`Transaction value: ${(tokenValue*0.98).toFixed(2)} tokens`);
  return (tokenValue*0.98).toFixed(2);
}

async function giveReward(web3, metadatas, transactionHash, tokenAddress){
  let rewards = [];
  let available_token = await getTotalReward(web3, transactionHash);
  for (let i = 0; i < metadatas.length; i++) {
      const workernode = metadatas[i];
      const reward = calculateReward(workernode.train_result);
      rewards.push(reward);
  }
  //calculate the total reward
  let total_reward = 0;
  for (let i = 0; i < rewards.length; i++) {
      total_reward += rewards[i];
  }
  //calculate the reward for each workernode
  for (let i = 0; i < rewards.length; i++) {
      rewards[i] = rewards[i]/total_reward * available_token;
      await transfer(web3, wallet, metadatas[i].address, tokenAddress, rewards[i]);
  }

}

function calculateReward(metadata){
  const average_gpu = metadata.gpu;
  const f1_score = metadata.f1_score;
  const accuracy = metadata.accuracy;
  const timeelapsed = metadata.time;
  const reward = f1_score*0.4 + accuracy*0.4 + average_gpu*0.1 + (1/timeelapsed)*0.1;
  return reward;
}

const util = {
    runBashCommand,
    transfer,
    getFileSize,
    payByFile,
    getTotalReward,
    giveReward,
    calculateReward
};

export default util;