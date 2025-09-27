import { Request, Response } from "express";
import { ICreateChattingGroup, IGetChatParams, IGetChatQuery, ISayHiDto, ISendMessageDto } from "./chat.dto";
import { successResponse } from "../../utils/response/success.response";
import { ChatRepository, UserRepository } from "../../DataBase/repository";
import { ChatModel, UserModel } from "../../DataBase/models";
import { Types } from "mongoose";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { connectedSockets } from "../005-gateway";
import { deleteFile, getPreSignedUrl, uploadFile } from "../../utils/multer/s3.config";
import { v4 as uuId } from "uuid";


export class ChatService {
    constructor() { }

    private chatModel = new ChatRepository(ChatModel);
    private userService = new UserRepository(UserModel);


    // IO

    sayHi = ({ socket, message, callback }: ISayHiDto) => {
        try {
            console.log(message);
            callback ? callback("Message Sent Success To BackEnd") : undefined;
        } catch (error) {
            socket.emit("custom_error", error);
        }
    }

    // Send OVO Message
    sendMessage = async ({ socket, content, sendTo, io }: ISendMessageDto) => {

        try {

            const createdBy = socket.credentials?.user?._id as unknown as Types.ObjectId;

            if (! await this.userService.findOne({
                filter: {
                    _id: Types.ObjectId.createFromHexString(sendTo),
                    friends: { $in: [createdBy] }
                }
            })) {
                throw new NotFoundException("Invalid Recipient Friend");
            }

            const chat = await this.chatModel.findOneAndUpdate({
                filter: {
                    participants: {
                        $all: [createdBy,
                            Types.ObjectId.createFromHexString(sendTo)]
                    },
                    group: { $exists: false }
                },
                updateData: {
                    $addToSet: {
                        messages: { content, createdBy }
                    }
                }
            })

            if (!chat) {

                const newChat = await this.chatModel.create({
                    data: [{
                        createdBy,
                        messages: [{ content, createdBy }],
                        participants: [createdBy,
                            Types.ObjectId.createFromHexString(sendTo)]
                    }]
                })
                if (!newChat) {
                    throw new BadRequestException("Fail To Send Message")
                }
            }


            if (socket.credentials?.user?.picture) {
                const key = await getPreSignedUrl({ Key: socket.credentials?.user?.picture });
                socket.credentials.user.picture = key
            }


            io?.to(connectedSockets.get(createdBy.toString() as string) as string[]).emit("success_message", { content })
            io?.to(connectedSockets.get(sendTo.toString()) as string[]).emit("new_message", { content, from: socket.credentials?.user })


        } catch (error) {
            socket.emit("custom_error", error);
        }
    }

    // REST API

    getChat = async (req: Request, res: Response) => {

        const { userId } = req.params as IGetChatParams;
        const { page, size } = req.query as IGetChatQuery

        const chat = await this.chatModel.findOneChat({
            filter: {
                participants: {
                    $all: [req.user?._id,
                    Types.ObjectId.createFromHexString(userId)]
                },
                group: { $exists: false }
            },
            options: {
                populate: [{
                    path: "participants",
                    select: "firstName lastName picture"
                },
                ]
            },
            page,
            size
        })


        if (!chat) {
            throw new BadRequestException("Fail To Find Chat");
        }

        const chatParticipants = chat?.participants as any;
        if (chatParticipants[0].picture) {
            chatParticipants[0].picture = await getPreSignedUrl({ Key: chatParticipants[0].picture });
        }

        if (chatParticipants[1].picture) {
            chatParticipants[1].picture = await getPreSignedUrl({ Key: chatParticipants[1].picture });
        }
        chat.participants = chatParticipants;

        return successResponse({
            res,
            data: {
                chat
            }
        });

    }

    createChattingGroup = async (req: Request, res: Response) => {


        const { groupName, participants }: ICreateChattingGroup = req.body;

        const userId = req.user?._id as unknown as Types.ObjectId;

        const dbParticipants = participants.map((participant) => {
            return Types.ObjectId.createFromHexString(participant);
        })
        if (dbParticipants.some((p) => p.toString() === userId.toString())) {
            throw new BadRequestException("Participants Cannot Include Creator Id");
        }

        const users = await this.userService.find({
            filter: {
                _id: { $in: dbParticipants },
            }
        });

        const notInFriendsList: any = [];

        users.data.map((user) => {
            if (!user.friends?.some(f => f.toString() === userId.toString())) {
                notInFriendsList.push(user._id);
            }
        })

        if (notInFriendsList.length) {
            throw new BadRequestException("Some Of Participants Not On Friends List", {
                participants: notInFriendsList
            });
        }

        const roomId = groupName.replaceAll(/\s+/g, "_") + "_" + uuId()

        let groupImage: string | undefined = undefined;

        if (req.file) {
            groupImage = await uploadFile({
                file: req.file,
                path: `chat/${roomId}`
            });
        }

        dbParticipants.push(userId);

        const newGroup = await this.chatModel.create({
            data: [{
                createdBy: userId,
                groupName,
                roomId,
                groupImage: groupImage as string,
                participants: dbParticipants
            }]
        })

        if(!newGroup){


            if(groupImage){
                await deleteFile({Key:groupImage});
            }


            throw new BadRequestException("Fail To Create This Group");
        }

        return successResponse({
            res,
            statusCode:201,
            message: "Group Created Success",
            data:{newGroup}
        })

    }

}