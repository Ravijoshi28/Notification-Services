import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import ServiceDefiner from "../app/InitialService/route.js"
import SmtpConnector from "../app/smtpConnection/route.js"
import ApiConnector from "../app/apiConnector/router.js"
import Project from "../app/projectsCreator/route.js"
import Auth from "../app/Authentication/router.js"

dotenv.config();

const PORT=process.env.PORT || 4000;

const app=express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials:true
}));


app.get("/health",(req,res)=>{
    res.status(200).send("Server is healthy");
})
app.use("/appNoti/api",ServiceDefiner)
app.use("/appNoti/api",SmtpConnector)
app.use("/appNoti/api",ApiConnector)
app.use("/appNoti/api",Project)
app.use("/appNoti/api",Auth)


app.listen(PORT ,()=>{
    console.log(`Server is running on port ${PORT}`);
})
