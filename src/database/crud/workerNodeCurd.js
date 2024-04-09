
import workerNode from "../schema/workerNode.js";
import NotFoundException from "../../exceptions/notFoundException.js";
import ExistedException from "../../exceptions/existedException.js";


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

    async getUserWallet(body){
        const wallet = await workerNode.findOne({ userId: body.userId});
        if(!wallet){
            throw new NotFoundException("wallet not found");
        }
        return wallet;
    },
    async removeWallet(body){
        console.log("body", body.userId);
        const wallet = await workerNode.findOneAndDelete({ userId: body.userId});
    
        if(!wallet){
            throw new NotFoundException("user not found");
        }
        return wallet;
    },
    async updateWallet(body){
        const wallet = await workerNode.findOneAndUpdate({ userId:   body.userId}, {status: body.status}, {new: true});
        if(!wallet){
            throw new NotFoundException("user not found");
        }
        return wallet;
    },
    async getListofWallet(){
        const wallets = await workerNode.find({});
        if(!wallets){
            throw new NotFoundException("wallet not found");
        }
        return wallets;
    }
}