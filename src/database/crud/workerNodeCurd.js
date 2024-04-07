
import workerNode from "../schema/workerNode.js";


export default{
    async createWallet(body){
        console.log("walletAddress", body);
        const exist = await workerNode.findOne({ walletAddress: body.walletAddress});
        console.log("exist", exist);
        if(exist){
            throw new ExistedException("wallet already exist");
        }
        const wallet = await workerNode.create(body);
        console.log("wallet", wallet);
        return wallet;
    },

    async getUserWallet(walletAddress){
        const wallet = await workerNode.findOne({ walletAddress: walletAddress});
        if(!wallet){
            throw new NotFoundException("wallet not found");
        }
        return wallet;
    }
}