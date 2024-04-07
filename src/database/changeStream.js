import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import util from '../utils/utils.js';

dotenv.config();


const mongdbUri =`mongodb+srv://howard9:${process.env.PASSWORD}@dmldatabase.vordk9h.mongodb.net/?retryWrites=true&w=majority&appName=DMLdataBase`
const filepath = "/mnt/c/Users/howar/Downloads/MINST/cw.txt";
async function startChangeStream() {
    console.log("startChangeStream");
    run().catch(console.dir);
}

async function run() {
    const client = new MongoClient(mongdbUri);
    let changeStream;
    try {
      const database = client.db("test");
      const haikus = database.collection("tickets");
      // Open a Change Stream on the "haikus" collection
      changeStream = haikus.watch();
      // Print change events as they occur
      for await (const change of changeStream) {
        console.log("Received data in cloud for user: ", change.fullDocument.userId);
        console.log("Ready to proceed Machine Learning")
        util.runBashCommand("cd /mnt/c/Users/howar/Downloads/MINST ; python3 emnist_fedavg_main.py");
        while (true){
            if (fs.existsSync(filepath)){
                break;
            }
        }
        console.log("Machine Learning is done")
      }
      // Close the change stream when done
      await changeStream.close();
      
    } finally {
      // Close the MongoDB client connection
      await client.close();
    }
  }
 

const stream = {
    startChangeStream
}
export default stream;