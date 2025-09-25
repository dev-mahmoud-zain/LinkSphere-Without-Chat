import { Router } from "express";
import usersService from "./users.service";
import { authenticationMiddeware, authorizationMiddeware } from "../../middlewares/authentication.middleware";
import { cloudFileUpload, fileValidation, StorageEnum } from "../../utils/multer/cloud.,multer";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as usersValidation from "./users.validation";
import { endPoints } from "./users.authorization";

const router = Router();

// ============================ Profile Management =============================

router.get("/profile",
    authenticationMiddeware(),
    usersService.profile);

router.patch("/profile-picture",
    authenticationMiddeware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.memory }).single("image")
    , usersService.uploadProfilePicture);

router.patch("/profile-cover-images",
    authenticationMiddeware(),
    cloudFileUpload({ validation: fileValidation.image, storageApproach: StorageEnum.disk }).array("images", 2)
    , usersService.uploadCoverImages);

router.delete("/profile-picture",
    authenticationMiddeware(),
    usersService.deleteProfilePicture);

router.delete("/profile-cover-images",
    authenticationMiddeware(),
    usersService.deleteCoverImages);



// =========================  Friendship Management ============================


router.post("/friend-requst/:userId",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.sendFriendRequst),
    usersService.sendFriendRequst);

router.patch("/accept-friend-requst/:requstId",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.acceptFriendRequst),
    usersService.acceptFriendRequst);

router.delete("/cancel-friend-requst/:requstId",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.cancelFriendRequst),
    usersService.cancelFriendRequst);

router.delete("/remove-friend/:userId",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.removeFriend),
    usersService.removeFriend);


// ========================= User Information Updates ==========================

router.patch("/update-basic-info",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.updateBasicInfo),
    usersService.updateBasicInfo);

router.patch("/update-email",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.updateEmail),
    usersService.updateEmail);

router.patch("/change-password",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.changePassword),
    usersService.changePassword);


router.patch("/confirm-update-email",
    authenticationMiddeware(),
    validationMiddleware(usersValidation.confirmUpdateEmail),
    usersService.confirmUpdateEmail);


// ============================= Account Control ===============================


router.delete("/freez/{:userId}",
    authorizationMiddeware(endPoints.freezAccount),
    validationMiddleware(usersValidation.freezAccount),
    usersService.freezAccount);

router.patch("/un-freez/:userId/admin",
    authorizationMiddeware(endPoints.unFreezAccountByAdmin),
    validationMiddleware(usersValidation.unFreezAccountByAdmin),
    usersService.unFreezAccountByAdmin);

router.patch("/un-freez/me",
    validationMiddleware(usersValidation.unFreezAccountByAccountAuther),
    usersService.unFreezAccountByAccountAuther);

router.delete("/delete/:userId",
    authorizationMiddeware(endPoints.deleteAccount),
    validationMiddleware(usersValidation.deleteAccount),
    usersService.deleteAccount);








// ============================= Admin Control ===============================


router.get("/change-role/:id",
    authorizationMiddeware(endPoints.changeRole),
    validationMiddleware(usersValidation.changeRole),
    usersService.changeRole);

export default router;