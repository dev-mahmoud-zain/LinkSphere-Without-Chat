import z from "zod";
import { generalFields } from "../../middlewares/validation.middleware";
import { RoleEnum } from "../../DataBase/models";

export const freezAccount = {
    params: z.object({
        userId: generalFields.id.optional()
    })
}

export const unFreezAccountByAdmin = {
    params: freezAccount.params.extend({})
}

export const unFreezAccountByAccountAuther = {
    body: z.strictObject({
        email: generalFields.email,
        password: generalFields.password
    })
}

export const deleteAccount = {
    params: z.object({
        userId: generalFields.id
    })
}

export const changePassword = {
    body: z.object({
        oldPassword: generalFields.password,
        newPassword: generalFields.password,
        confirmNewPassword: z.string()
    }).superRefine((data, ctx) => {
        if (data.newPassword !== data.confirmNewPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmNewPassword"],
                message: "newPassword and confirmNewPassword must be the same."
            })
        }
        if (data.oldPassword === data.newPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["oldPassword"],
                message: "Old Password And New Password Cannot Be The Same."
            })
        }
    })
}

export const updateBasicInfo = {
    body: z
        .object({
            userName: generalFields.userName.optional(),
            phone: generalFields.phone.optional(),
            gender: generalFields.gender.optional(),
        })
        .strict()
        .superRefine((data, ctx) => {
            if (
                !data.userName && !data.phone && !data.gender
            ) {
                ctx.addIssue({
                    code: "custom",
                    message: "No Input Data To Update!",
                    path: ["userName", "phone", "gender"]
                });
            }
        }),
};

export const updateEmail = {
    body: z
        .strictObject({
            email: generalFields.email
        })
};

export const confirmUpdateEmail = {
    body: z.strictObject({
        OTP: generalFields.OTP,
    })
};

export const sendFriendRequst = {
    params: z.strictObject({
        userId: generalFields.id
    })
}

export const acceptFriendRequst = {
    params: z.strictObject({
        requstId:generalFields.id
    })
}

export const removeFriend = {
    params: sendFriendRequst.params.extend({})
}


export const cancelFriendRequst = {
    params : acceptFriendRequst.params.extend({})
}


export const changeRole = {

    params: z.strictObject({
        id: generalFields.id
    }),
    body: z.strictObject({
        role: z.enum(RoleEnum)
    })
}