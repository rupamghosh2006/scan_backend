import express from "express"
import cors from "cors"

const app = express()

// ✅ Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

//routes import

import questionRouter from "./routes/question.routes.js"

app.use("/api/v1/scan", questionRouter)

export {app}