import express from "express"

const app = express()

// Middleware to parse JSON
app.use(express.json());

//routes import

import questionRouter from "./routes/question.routes.js"

app.use("/api/v1/scan", questionRouter)

export {app}