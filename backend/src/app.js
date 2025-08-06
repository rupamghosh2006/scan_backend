import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// ✅ Enable CORS for all origins
app.use(cors(
    {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
));

// Middleware to parse JSON
app.use(express.json(
    {
        limit: "16kb"
    }));

app.use(express.urlencoded(
    {
        extended: true, 
        limit: "16kb"
    }
))

app.use(express.static("public"))

app.use(cookieParser())

//routes import

import questionRouter from "./routes/question.routes.js"

app.use("/api/v1/scan", questionRouter)

// student routes import 

import studentRouter from "./routes/student.routes.js"
app.use("/api/v1/students", studentRouter)

// test config route import

import testConfigRoutes from "./routes/testConfig.routes.js"
app.use("/api/v1/tests", testConfigRoutes)

// test response route import
import testResponseRoutes from "./routes/testResponse.routes.js";
app.use("/api/v1/testResponses", testResponseRoutes);

import scan from "./routes/scan.route.js"
app.use("/api/v2/scan", scan)
export {app}