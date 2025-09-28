import express from "express";
import type { Request, Response } from "express";

import cors from "cors";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

// Setup Env Config
import { config } from "dotenv";
config()

// import { resolve } from "node:path";
// config({ path: resolve("./config/.env.development") })


import { authRouter, postsRouter, usersRouter } from "./modules/";
import { globalErrorHandler } from "./utils/response/error.response";
import connectToDataBase from "./DataBase/DB_Connection";

// App Start Point

const app = express();
// const port: Number | String = process.env.PORT || 5000;

// Third Party MiddleWares
const limiter = rateLimit({
    windowMs: 60 * 6000,
    limit: 2000,
    message: { error: "Too Many Requests , Try Again Later" },
    statusCode: 429
});
app.use(cors(), helmet(), express.json(), limiter);

// DataBase
connectToDataBase();

// Application Routing 

// Main Router
app.get("/", (req: Request, res: Response): Response => {
    return res.json({
        message: "Welcome To LinkSphere BackEnd API",
        info: "LinkSphere is a social networking application that connects people, enables sharing posts, and fosters meaningful interactions in a modern digital community.",
        about: "This APP Created By Dev: Adham Zain @2025",
    })
})

// Authentication Router
app.use("/auth", authRouter);

// Users Router
app.use("/users", usersRouter);

// Users Router
app.use("/posts", postsRouter);

// Get Asset From S3 :
//  ملهاش لازمة حالياً 
//  انا برجع لينك الصورة دايركت مع اليوزر في البروفايل
// أبقى اشغلها لما أحتاجها


// app.get("/images/*path", async (req, res): Promise<void> => {
//     const { path } = req.params as { path: string[] };
//     const Key = path.join("/");
//     const s3Response = await getAsset({ Key });
//     if (!s3Response?.Body) {
//         throw new BadRequestException("Fail To Fetch This Resourse");
//     }
//     res.setHeader(
//         "Content-Type",
//         s3Response.ContentType || "application/octet-stram"
//     );
//     // return s3CreateWriteStream(s3Response.Body as NodeJS.ReadableStream, res);
//     res.json({Key})
// })


// Global Error Handler
app.use(globalErrorHandler)


// 404 Router 
app.all("{*dummy}", (req: Request, res: Response) => {
    res.status(404).json({
        message: "Page Not Found",
        info: "Place Check Your Method And URL Path",
        method: req.method,
        path: req.path
    })
});


// app.listen(port, () => {
//     console.log("===================================")
//     console.log("LinkSphere App Is Running Success 🚀")
//     console.log("===================================")
// });


export default app;
