import workerNode from "../schema/workerNode.js";


export default{
    async createWallet(body){
        const exist = await Wallet.findOne({ userId: body.userId, chainId: body.chainId});
        if(exist){
            throw new ExistedException("wallet already exist");
        }
        const wallet = await Wallet.create(body);
        return wallet;
    },

    async getUserWallet(userId, chainId){
        const wallet = await Wallet.findOne({ userId: userId, chainId: chainId });
        if(!wallet){
            throw new NotFoundException("wallet not found");
        }
        return wallet;
    }
}