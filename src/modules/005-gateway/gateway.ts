import { Server as HttpServer } from "node:http";

import { Server } from "socket.io";
import { TokenService, TokenTypeEnum } from "../../utils/security/token.security";
import { IAuthSocket } from "./index"
import { ChatGateway } from "../006-chat";
import { BadRequestException } from "../../utils/response/error.response";

const tokenService = new TokenService()

export const connectedSockets = new Map<string, string>();

let io: undefined | Server = undefined;

export const initializeIo = (httpServer: HttpServer) => {

    // Listen To => http://localhost:3000
    io = new Server(httpServer, {
        // Handle Cors Origin
        cors: {
            origin: "*",
        }
    });

    function HandleDisconect(socket: IAuthSocket) {
        return socket.on("disconnect", () => {
            connectedSockets.delete(socket.credentials?.decoded?._id.toString());
            getIo().emit("offline_user", socket.credentials?.decoded?._id.toString());
        })
    }

    // Initialize Midlleware
    getIo().use(async (socket: IAuthSocket, next) => {
        try {
            socket.credentials = await tokenService.decodeToken({
                authorization: socket.handshake.auth.authorization,
                tokenType: TokenTypeEnum.accses
            });
            connectedSockets.set(socket.credentials.decoded?._id.toString(), socket.id);

            console.log("Coneected Sockets", connectedSockets)
            next();

        } catch (error: any) {
            next(error);
        }

    })

    const chatGateway = new ChatGateway();

    // Open Connection
    getIo().on("connection", (socket: IAuthSocket) => {

        getIo().emit("online_user", socket.credentials?.decoded?._id.toString());

        chatGateway.register(socket,getIo());

        // Handle Disconect
        HandleDisconect(socket);

    })

}

export const getIo = ():Server => {

    if (!io) {
        throw new BadRequestException("Fail To Connect To Io");
    }

    return io
}