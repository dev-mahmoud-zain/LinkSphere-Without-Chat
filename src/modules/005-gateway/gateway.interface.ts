import { Socket } from "socket.io";
import { HUserDoucment } from "../../DataBase/models";
import { JwtPayload } from "jsonwebtoken";

export interface IAuthSocket extends Socket {
    credentials?: {
        user?: Partial<HUserDoucment>;
        decoded?: JwtPayload;
    }
}