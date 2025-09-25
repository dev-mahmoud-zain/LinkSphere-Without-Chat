import { Request, Response } from "express";
import { succsesResponse } from "../../utils/response/succses.response";
import { PostRepository, UserRepository, CommentRepository } from "../../DataBase/repository";
import { UserModel, PostModel, CommentModel, AllowCommentsEnum, HPostDucment, CommentFlagEnum } from "../../DataBase/models";
import { BadRequestException, NotFoundException } from "../../utils/response/error.response";
import { I_CreateCommentInputs, I_ReplyOnCommentInputs, I_UpdateCommentInputs } from "./comments.dto";
import { postAvailability } from "../003-posts";
import { deleteFile, uploadFile } from "../../utils/multer/s3.config";
import { Types } from "mongoose";


export class Comments {

    private userModel = new UserRepository(UserModel);
    private postModel = new PostRepository(PostModel);
    private commentModel = new CommentRepository(CommentModel);

    constructor() { }

    private postExists = async (postId: Types.ObjectId, req: Request): Promise<HPostDucment | Boolean> => {
        const post = await this.postModel.findOne({
            filter: {
                _id: postId,
                $or: postAvailability(req),
                allowcomments: AllowCommentsEnum.allow
            }
        })
        if (!post) {
            return false;
        }
        return post;
    }

    createComment = async (req: Request, res: Response): Promise<Response> => {

        const { tags, attachment }: I_CreateCommentInputs = req.body;

        const postId = req.params.postId as unknown as Types.ObjectId;

        const post = await this.postExists(postId, req) as HPostDucment;

        if (!post) {
            throw new NotFoundException("Post Not Found Or Cannot Create Comment")
        }

        if (
            tags?.length && (await this.userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            })).data.length !== tags.length
        ) {
            throw new NotFoundException("Some Mentions Users Not Exist")
        }

        if (tags?.includes(req.tokenDecoded?._id)) {
            throw new BadRequestException("User Cannot Mention Himself")
        }

        let attachmentKey: string = "";

        if (attachment) {
            attachmentKey = await uploadFile({
                file: attachment as Express.Multer.File,
                path: `users/${post.createdBy}/posts/comments/${post.assetsFolderId}`
            });
        }

        const [comment] = await this.commentModel.create({
            data: [{
                flag: CommentFlagEnum.comment,
                ...req.body,
                postId,
                attachment: attachmentKey,
                createdBy: req.tokenDecoded?._id
            }]
        }) || []

        if (!comment) {
            if (attachment) {
                await deleteFile({ Key: attachmentKey })
            }
            throw new BadRequestException("Fail To Create Comment");
        }

        return succsesResponse({
            res, statusCode: 201,
            info: "Comment Created Succses",
            data: { commentId: comment._id }
        });

    }

    getComment = async (req: Request, res: Response): Promise<Response> => {

        const { commentId, postId } = req.params as unknown as {
            commentId: Types.ObjectId,
            postId: Types.ObjectId
        };

        if (!await this.postExists(postId, req)) {
            throw new BadRequestException("Post Not Exist");
        }

        const comment = await this.commentModel.findOne({
            filter: { _id: commentId },
            options: {
                populate: [{
                    path: "lastReply",
                }]
            }
        })

        if (!comment) {
            throw new BadRequestException("Comment Not Exist");
        }

        return succsesResponse({
            res, statusCode: 200,
            data: { comment }
        });

    }

    updateComment = async (req: Request, res: Response): Promise<Response> => {

        const { tags, attachment, removeAttachment }: I_UpdateCommentInputs = req.body;
        const { postId, commentId } = req.params as unknown as {
            postId: Types.ObjectId,
            commentId: Types.ObjectId
        }
        const userId = req.user?._id as unknown as Types.ObjectId;

        const post = await this.postExists(postId, req) as HPostDucment;

        if (!post) {
            throw new NotFoundException("Post Not Found Or Cannot Update Comment")
        }

        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                postId,
            }
        });

        if (!comment) {
            throw new NotFoundException("Comment Not Found");
        }

        if (!comment.createdBy.equals(userId)) {
            throw new NotFoundException("Only Creator Can Edit This Comment");
        }

        if (
            tags?.length && (await this.userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            })).data.length !== tags.length
        ) {
            throw new NotFoundException("Some Mentions Users Not Exist")
        }

        if (tags?.includes(userId.toString())) {
            throw new BadRequestException("User Cannot Mention Himself")
        }

        let updatedComment;
        let attachmentKey: string = "";

        if (removeAttachment) {

            if (comment.attachment) {
                await deleteFile({ Key: comment.attachment });
            }
            else {
                throw new BadRequestException("No Attachment For This Comment");
            }


            updatedComment = await this.commentModel.findOneAndUpdate({
                filter: {
                    _id: commentId,
                    createdBy: userId
                },
                updateData: {
                    ...req.body,
                    tags,
                    $unset: {
                        attachment: 1
                    }
                }
            })
        }
        else {

            if (attachment) {
                if (comment.attachment) {
                    await deleteFile({ Key: comment.attachment });
                }
                attachmentKey = await uploadFile({
                    file: attachment as Express.Multer.File,
                    path: `users/${postId}/posts/comments/${commentId}`
                });
            }
            updatedComment = await this.commentModel.findOneAndUpdate({
                filter: {
                    _id: commentId,
                    createdBy: userId
                },
                updateData: {
                    ...req.body,
                    attachment: attachmentKey || comment.attachment,
                    tags,
                }
            })
        }


        if (!updatedComment) {
            if (attachment) {
                await deleteFile({ Key: attachmentKey })
            }
            throw new BadRequestException("Fail To Create Comment");
        }

        return succsesResponse({
            res, statusCode: 201,
            info: "Comment Updated Succses",
            data: { commentId: comment._id }
        });

    }

    replyOnComment = async (req: Request, res: Response): Promise<Response> => {

        const { tags, attachment }: I_ReplyOnCommentInputs = req.body;

        const { postId, commentId } = req.params as unknown as {
            postId: Types.ObjectId,
            commentId: Types.ObjectId
        };

        const post = await this.postExists(postId, req) as HPostDucment

        if (!post) {
            throw new BadRequestException("Post Not Found");
        }

        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                postId: postId
            }
        });

        if (!comment) {
            throw new NotFoundException("Comment Not Found")
        }

        if (
            tags?.length && (await this.userModel.find({
                filter: {
                    _id: { $in: tags }
                }
            })).data.length !== tags.length
        ) {
            throw new NotFoundException("Some Mentions Users Not Exist")
        }

        if (tags?.includes(req.tokenDecoded?._id)) {
            throw new BadRequestException("User Cannot Mention Himself")
        }

        let attachmentKey: string = "";

        if (attachment) {
            attachmentKey = await uploadFile({
                file: attachment as Express.Multer.File,
                path: `users/${post.createdBy}/posts/comments/${post.assetsFolderId}`
            });
        }


        const [reply] = await this.commentModel.create({
            data: [{
                ...req.body,
                flag: CommentFlagEnum.reply,
                postId,
                commentId,
                attachment: attachmentKey,
                createdBy: req.tokenDecoded?._id
            }]
        }) || []

        if (!reply) {
            if (attachment) {
                await deleteFile({ Key: attachmentKey })
            }
            throw new BadRequestException("Fail To Create Comment");
        }

        return succsesResponse({
            res, statusCode: 201,
            info: "Replyed Succses",
            data: { replyId: reply._id }
        });

    }

    likeComment = async (req: Request, res: Response): Promise<Response> => {

        const { postId, commentId } = req.params as unknown as {
            postId: Types.ObjectId,
            commentId: Types.ObjectId
        };

        const userId = req.user?._id as unknown as Types.ObjectId;

        if (!await this.postExists(postId, req)) {
            throw new BadRequestException("Post Not Found");
        }

        const comment = await this.commentModel.findOne({
            filter: {
                _id: commentId,
                postId
            }
        });

        if (!comment) {
            throw new NotFoundException("Comment Not Found!");
        }

        let updateData = {};
        let message: string = "";

        if (comment.likes?.includes(userId)) {
            updateData = { $pull: { likes: userId } };
            message = `${comment.flag === CommentFlagEnum.comment ? "Comment" : "Reply"} Unliked Succses`
        } else {
            updateData = { $addToSet: { likes: userId } };
            message = `${comment.flag === CommentFlagEnum.comment ? "Comment" : "Reply"} Liked Succses`
        }

        await this.commentModel.findOneAndUpdate({
            filter: {
                _id: commentId
            }, updateData
        });

        return succsesResponse({
            res,
            message
        });
    }

    deleteComment = async (req: Request, res: Response): Promise<Response> => {

        const { postId, commentId } = req.params as unknown as {
            postId: Types.ObjectId,
            commentId: Types.ObjectId
        };

        const userId = req.user?._id as unknown as Types.ObjectId;

        const comment = await this.commentModel.findOneAndDelete({
            filter: {
                _id: commentId,
                postId,
                createdBy: userId
            }
        })

        if (!comment) {
            throw new BadRequestException("Comment Not Exist Or Not Authorized To Remove")
        }


        if (comment.flag === CommentFlagEnum.comment) {

            const { data } = await this.commentModel.find({
                filter: {
                    postId,
                    commentId,
                    flag: CommentFlagEnum.reply,
                    attachment: { $exists: true }
                }
            })

            // Delete Replys Attachments
            if (data.length) {
                await Promise.all(
                    data
                        .filter((reply) => reply.attachment)
                        .map((reply) => deleteFile({ Key: reply.attachment! }))
                );
            }

            // Delete Replys
            await this.commentModel.deleteMany({
                postId,
                commentId,
                flag: CommentFlagEnum.reply,
            })

        }

        return succsesResponse({
            res,
            message: "Comment Deleted Succses"
        });
    }

}