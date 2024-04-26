
import userCurd from "../schema/userSchema.js";
import ExistedException from "../../exceptions/existedException.js";
import NotFoundException from "../../exceptions/notFoundException.js";


export default{
    async createUser(body){
        const exist = await userCurd.findOne({ userId: body.userId});
        if(exist){
            throw new ExistedException("user already exist");
        }
        const user = await userCurd.create(body);
        return user;
    },
    async getUser(body){ 
        const ticket = await userCurd.findOne({ userId: body.userId, password: body.password, userType: body.userType});
        if (ticket){
            return ticket;
        }
    },

}