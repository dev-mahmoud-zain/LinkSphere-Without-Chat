import { ISayHiDto } from "./chat.dto";

export class ChatService {
    constructor() { }

    sayHi = ({ socket, message, callback }: ISayHiDto) => {
        console.log(message);
        callback ? callback("Message Sent Succses To BackEnd") : undefined;
    }
}