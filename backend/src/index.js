import connectDB from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv";
dotenv.config();

connectDB()
.then(
    () => {
        app.on("error", (error) => {
            console.error("ERROR: ", error)
            throw error
        })
        app.listen(process.env.PORT || 8000, () =>{
            console.log(`Server is running at port :
            ${process.env.PORT}`);        
        })
    }
)
.catch(
    (err) => {
        console.log("MONGO db connection failed !!!", err);
    }
)