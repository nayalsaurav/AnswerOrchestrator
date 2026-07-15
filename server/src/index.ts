import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat"
const app = express();
app.use(cors());
app.use(express.json())
const PORT = process.env.PORT || 3000;

app.get('/health',(_req,res)=>{
    res.status(200).json({
        status:"ok",
        uptime:process.uptime()
    })
})

app.use("/api/v1/chat",chatRouter)

app.listen(PORT,()=>{
    console.log(`Server is running at http://localhost:${PORT}`)
})