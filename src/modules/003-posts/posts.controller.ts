import { Router } from "express";
import { PostService } from "./posts.srevice";
import { authenticationMiddleware, authorizationMiddleware } from "../../middlewares/authentication.middleware";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import *  as  validation from "./posts.validation";
import { router as commentsRouter } from "../004-comments/index"
import { endPoints } from "./posts.authorization";

const postService = new PostService();

const router = Router();

router.use("/:postId/", commentsRouter)

router.post("/create-post",
    authenticationMiddleware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("attachments", 2),
    validationMiddleware(validation.createPost),
    postService.createPost);

router.patch("/update-post/{:postId}",
    authenticationMiddleware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("attachments", 2),
    validationMiddleware(validation.updatePost),
    postService.updatePost);

router.get("/",
    authenticationMiddleware(),
    validationMiddleware(validation.getPosts),
    postService.getPosts);

router.get("/{:postId}",
    // authenticationMiddleware(), مؤقتاً بس عشان نشوفها من الميل
    validationMiddleware(validation.getPost),
    postService.getPost);

router.post("/like/:postId",
    authenticationMiddleware(),
    validationMiddleware(validation.likePost),
    postService.likePost);

router.delete("/freez/:postId",
    authenticationMiddleware(),
    validationMiddleware(validation.deletePost),
    postService.freezPost);

router.patch("/unfreez/:postId",
    authenticationMiddleware(),
    validationMiddleware(validation.deletePost),
    postService.unFreezPost);

router.delete("/:postId",
    authorizationMiddleware(endPoints.deletePost),
    validationMiddleware(validation.deletePost),
    postService.deletePost);


export default router;