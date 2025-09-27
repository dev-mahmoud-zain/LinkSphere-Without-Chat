import { Server } from "socket.io";
import { IAuthSocket } from "../005-gateway";
import { ChatService } from "./chat.service";


export class ChatEvents {
    constructor() { }

    private chatService = new ChatService();


    sayHi = (socket: IAuthSocket) => {

        socket.on("sayHi", (message, callback) => {
            this.chatService.sayHi({ socket, message, callback })
        });
    }

    sendMessage = (socket: IAuthSocket, io: Server) => {

        socket.on("send_message", (data: { content: string, sendTo: string }) => {
            this.chatService.sendMessage({ socket, ...data, io })
        });
    }

}