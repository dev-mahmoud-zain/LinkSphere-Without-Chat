import { Router } from "express";
import AuthenticationServices from "./auth.service";
import { validationMiddleware } from "../../middlewares/validation.middleware";
import * as authValidators from "./auth.validation"
import { authenticationMiddeware } from "../../middlewares/authentication.middleware";
import { TokenTypeEnum } from "../../utils/security/token.security";

const router = Router();



// ================= Account Registration & Email Verification =================

router.post("/signup",
    validationMiddleware(authValidators.signup),
    AuthenticationServices.signup);

router.patch("/confirm-email",
    validationMiddleware(authValidators.confirmEmail),
    AuthenticationServices.confirmEmail);

router.post("/re-send-confirm-email-otp",
    validationMiddleware(authValidators.reSendConfirmOTP),
    AuthenticationServices.reSendConfirmOTP);

router.post("/signup-with-gmail",
    validationMiddleware(authValidators.signupWithGmail),
    AuthenticationServices.signupWithGmail);


// ======================== Login & Session Management =========================

router.post("/login",
    validationMiddleware(authValidators.login),
    AuthenticationServices.login);

router.post("/login/verify-otp-code",
    validationMiddleware(authValidators.verifyLoginOTPCode),
    AuthenticationServices.verifyLoginOTPCode);

router.post("/logout",
    validationMiddleware(authValidators.logout),
    authenticationMiddeware(),
    AuthenticationServices.logout);

router.get("/refresh-token",
    authenticationMiddeware(TokenTypeEnum.refresh),
    AuthenticationServices.refreshToken);


// =================== Password Reset (Forget Password Flow) ===================

router.post("/forget-password",
    validationMiddleware(authValidators.frogetPassword),
    AuthenticationServices.frogetPassword);

router.post("/resend-forget-password-otp",
    validationMiddleware(authValidators.frogetPassword),
    AuthenticationServices.reSendForgetPasswordOTP);

router.post("/change-forget-password",
    validationMiddleware(authValidators.changeForgetPassword),
    AuthenticationServices.confirmForgetPasswordOTP(),
    AuthenticationServices.changeForgetPassword);


// ======================== Two-Step Verification (2FA) ========================
 
router.patch("/change-two-setup-verification",
    authenticationMiddeware(),
    AuthenticationServices.changeTwoSetupVerification);

router.patch("/verify-enable-two-setup-verification",
    authenticationMiddeware(),
    validationMiddleware(authValidators.verifyEnableTwoSetupVerification),
    AuthenticationServices.verifyEnableTwoSetupVerification);






// router.post("/verify-token",
//     validationMiddleware(authValidators.verifyToken),
//     AuthenticationServices.verifyToken);


export default router;