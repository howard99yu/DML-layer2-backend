
import tickets from "../schema/ticketSchema.js";
import ExistedException from "../../exceptions/existedException.js";
import NotFoundException from "../../exceptions/notFoundException.js";


export default{
    async createTicket(body){
        const ticket = await tickets.create(body);
        return ticket;
    },
    async updateTicket(body){
        const ticket = await tickets.findOneAndUpdate({ userId: body.userId, transactionHash: body.transactionHash}, {uploadStatus: body.uploadStatus}, {new: true});
        if (!ticket){
            throw new NotFoundException("ticket not found");
        }
        return ticket;
    },
    async getTicket(body){ 
        const ticket = await tickets.findOne({ userId: body.userId, uploadStatus: body.uploadStatus});
        if (ticket){
            return ticket;
        }
    },

}