import { exec } from "child_process";
import TokenABI from "../../contractABI/tokenABI.js";
import BigNumber from "bignumber.js";
import Web3 from "web3";
import { SMTPClient } from "emailjs";
import 'dotenv/config';
import c from "args";

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
    const nonce = await web3.eth.getTransactionCount(sender.address, "latest");

    const txObject = {
      gasLimit: Web3.utils.toHex(gasLimit),
      gasPrice: Web3.utils.toHex(gasPrice),
      from: sender.address,
      to: contract,
      nonce: nonce,
      data: tokenCrt.methods.transfer(recipient, amount).encodeABI(),
    };

    // Sign and send the transaction
    const signedTx = await web3.eth.accounts.signTransaction(
      txObject,
      sender.privateKey
    );
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );
    return receipt.logs[0].transactionHash;
    console.log(receipt.logs[0]);
  } catch (error) {
    console.error("Error transferring tokens:", error);
  }
}

async function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  if (stats.isFile()) {
    const size = stats.size;
    console.log(`${fileName} size: ${Math.round(size / 1024)} KB`);
    return Math.round(size / 1024);
  }
  return "File not found";
}

async function payByFile(web3, sender, recipient, contract, filesize) {
  let amount = filesize * 0.0001;
  console.log(`Amount to be paid: ${amount} tokens`);
  const result = await transfer(web3, sender, recipient, contract, amount);
  console.log(result);
}

async function getTotalReward(web3, transactionHash) {
  const transaction = await web3.eth.getTransactionReceipt(transactionHash);
  const tokenValue = new BigNumber(transaction.logs[0].data)
    .dividedBy("1e18")
    .toNumber();
  console.log(`Transaction value: ${(tokenValue * 0.98).toFixed(2)} tokens`);
  return (tokenValue * 0.98).toFixed(2);
}

async function giveReward(
  web3,
  wallet,
  metadatas,
  transactionHash,
  tokenAddress,
  walletAddresses
) {
  let rewards = [];
  let result = [];
  let available_token = await getTotalReward(web3, transactionHash);
  for (let i = 0; i < metadatas.length; i++) {
    const workernode = metadatas[i];
    const reward = calculateReward(workernode);
    rewards.push(reward);
  }
  //calculate the total reward
  let total_reward = 0;
  for (let i = 0; i < rewards.length; i++) {
    total_reward += rewards[i];
  }
  //calculate the reward for each workernode
  for (let i = 0; i < rewards.length; i++) {
    rewards[i] = (rewards[i] / total_reward) * available_token;
    console.log(roundDown(rewards[i], 2) + " tokens");
    try {
      const txHash = await transfer(
        web3,
        wallet,
        walletAddresses[i],
        tokenAddress,
        roundDown(rewards[i], 2)
      );
      result.push(txHash);
    } catch (err) {
      console.log(err);
    }
  }
  return result;
}

function calculateReward(metadata) {
  const accuracy =
    (metadata.sparse_categorical_accuracy[0] /
      metadata.sparse_categorical_accuracy[1]) *
    100;
  const reward = accuracy;
  return reward;
}
function roundDown(number, decimalPlaces) {
  const factor = Math.pow(10, decimalPlaces);
  return Math.floor(number * factor) / factor;
}
async function payNativeToken(
  web3,
  senderAddress,
  receiverAddress,
  senderPrivateKey,
  amount
) {
  amount = roundDown(amount, 6);
  web3.eth.accounts.wallet.add(senderPrivateKey);
  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = 100000;
  const nonce = await web3.eth.getTransactionCount(senderAddress, "latest");

  return new Promise((resolve) => {
    const txn = web3.eth.sendTransaction({
      gasLimit: web3.utils.toHex(gasLimit),
      gasPrice: web3.utils.toHex(gasPrice),
      from: senderAddress,
      to: receiverAddress,
      nonce: nonce,
      value: web3.utils.toWei(amount.toString(), "ether"),
    });
    txn.once("receipt", (receipt) => {
      var gasFee = receipt.gasUsed * receipt.effectiveGasPrice;
      gasFee = web3.utils.fromWei(gasFee.toString());
      var status;
      if (receipt.status) {
        status = "Success";
      } else {
        status = "Failed";
      }
      const response = {
        status: status,
        message: {
          transactionId: receipt.transactionHash,
          gasFee: Number(gasFee),
          senderAddress: senderAddress,
          receiverAddress: receiverAddress,
          amount: amount,
        },
      };
      resolve(response);
    });
    txn.on("error", (error) => {
      const response = {
        status: "Failed",
        message: error.message,
      };
      resolve(response);
    });
    web3.eth.accounts.wallet.remove(senderAddress);
  });
}

import nodemailer from "nodemailer";
async function sendEmail(params, title, receiver) {
  try {
    const client = new SMTPClient({
      user: process.env.EMAIL,
      password: process.env.EMAIL_PASSWORD,
      host: process.env.EMAIL_SMTP,
      ssl: true,
    });
    client.send({
      text: params,
      from: process.env.EMAIL,
      to: receiver,
      subject: title,
    });
    return client;
  } catch (e) {
    console.log("Error sending email, retrying..." + e);
  }
  // Create a transporter
  // let transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   // host: "smtp.gmail.com",
  //   port: 465,
  //   secure: true,
  //   auth: {
  //     type: "OAUTH2",
  //     user: process.env.EMAIL, //set these in your .env file
  //     clientId: process.env.OAUTH_CLIENT_ID,
  //     clientSecret: process.env.OAUTH_CLIENT_SECRET,
  //     refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  //     accessToken: process.env.OAUTH_ACCESS_TOKEN,
  //     expires: 3599,
  //   },
  // });
  // // Define the email options
  // let mailOptions = {
  //   from: process.env.EMAIL,
  //   to: receiver,
  //   subject: title,
  //   text: params,
  // };
  // transporter.sendMail(mailOptions, function (error, info) {
  //   if (error) {
  //     console.log(error);
  //   } else {
  //     console.log("Email sent: " + info.response);
  //   }
  // });
}

const util = {
  runBashCommand,
  transfer,
  getFileSize,
  payByFile,
  getTotalReward,
  giveReward,
  calculateReward,
  payNativeToken,
  sendEmail,
};

export default util;
