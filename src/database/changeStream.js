import { MongoClient } from 'mongodb';
import util from '../utils/utils.js';
import fs from 'fs';
import workerNodeCurd from '../database/crud/workerNodeCurd.js';
import ticketCrud from '../database/crud/ticketCrud.js';
import Web3 from "web3";

const mongdbUri =`mongodb+srv://howard9:${process.env.PASSWORD}@dmldatabase.vordk9h.mongodb.net/?retryWrites=true&w=majority&appName=DMLdataBase`
const web3 = new Web3(new Web3.providers.HttpProvider("https://rpc-amoy.polygon.technology/"));
const mainNode = process.env.MAINNODE;
const options = ["./ML/report.txt","./ML/report2.txt","./ML/report3.txt"];

const wallet = web3.eth.accounts.privateKeyToAccount(mainNode);
const contract = process.env.CONTRACT;

async function startChangeStream() {
    console.log("startChangeStream");
    run().catch(console.dir);
}

async function run() {
    const client = new MongoClient(mongdbUri);
    let changeStream;
      const database = client.db("test");
      const haikus = database.collection("tickets");
      // Open a Change Stream on the "haikus" collection
      changeStream = haikus.watch();
      // Print change events as they occur

      for await (const change of changeStream) {
        if (change.fullDocument !== undefined){
            //generate a random number from 0 to 2
            //const random = Math.floor(Math.random() * 3);
            const filepath = './ML/report.txt'
          console.log("Received data in cloud for user: ", change.fullDocument.userId);
          console.log("Ready to proceed Machine Learning")
          //util.runBashCommand("python3 ./ML/emnist_fedavg_main.py");
          while (true){
              if (fs.existsSync(filepath)){
                  break;
              }
          }
          let data = fs.readFileSync(filepath, 'utf8');
          data = data.replace(/'/g, '"');
          console.log(data)
          data = JSON.parse(data);
          console.log("Machine Learning is done return status: ", data.status);
          if (data.status === "success"){
            let metadatas = JSON.parse(fs.readFileSync("./ML/mo.txt", 'utf8'));
            await ticketCrud.updateTicket({
                userId: change.fullDocument.userId,
                transactionHash: change.fullDocument.transactionHash,
                uploadStatus: "completed",
            });
            let walletAddresses = [];
            for (let i in data.data){
                try{
                    const wallet = await workerNodeCurd.getUserWallet(i);
                    walletAddresses.push(wallet.walletAddress);
                }catch(err){
                    console.log(err)
                }
        
            }
            console.log(walletAddresses)
            const txHashes = await util.giveReward(web3, wallet,metadatas, change.fullDocument.transactionHash, contract, walletAddresses);
            console.log("Rewarded node providers accordingly: ", txHashes);
            let params = "Your ticket has been completed successfully";
            let title = "Training Complete!";
            let receiver = change.fullDocument.userId
            await util.sendEmail(params,title,receiver)
          }else{
            console.log("Malicious activity detected in the node providers")
            let count = 0;
            for (const node in data.data){
            if (data.data[node]=="fail"){
                try{
                    const result =await workerNodeCurd.updateWallet({
                        userId: node,
                        status: "banned"
                    });
                    console.log("malicious node provider ", node, " has been banned")
                    count += 1;
                }catch(err){
                    console.log("error")
                }
            }
            }
            let rewardAmount = 0.001*count;
            rewardAmount = rewardAmount/(Object.keys(data.data).length-count);
            console.log("user will get back token")
            try{
                console.log(change.fullDocument.userId)
                const userInfo = await ticketCrud.getTicket({userId: change.fullDocument.userId, uploadStatus: "uploaded"});
                console.log(userInfo)
                await util.transfer(web3, wallet, userInfo.walletAddress, contract, userInfo.amount);
                console.log("transfer done")
                await ticketCrud.updateTicket({
                    userId: change.fullDocument.userId,
                    uploadStatus: "rollback",
                    transactionHash: change.fullDocument.transactionHash
                });
                console.log("deposited coin will be distributed to other node provider")
                try{
                    for (const node in data.data){
                        if (data.data[node]=="success"){
                            console.log("paying node provider : ",node)
                            console.log("reward amount: ",rewardAmount)
                            let receiver = await workerNodeCurd.getUserWallet(node);
                            await util.payNativeToken(web3,wallet.address,receiver.walletAddress,wallet.privateKey,rewardAmount);
                        }
                    }
                    let params = "Your ticket has been rollbacked due to malicious activity in the node provider";
                    let title = "Ticket Rollbacked";
                    let receiver = change.fullDocument.userId
                    await util.sendEmail(params,title,receiver)
                }catch(err){
                    console.log(err)
                }
            }
            catch(err){
                console.log("error: ticket does not exist")
            }
          }
        //check for malicious node provider (check by meta data)


        }
      }
      // Close the change stream when done

  }
 

const stream = {
    startChangeStream
}
export default stream;