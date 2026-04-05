import express  from 'express'
import {createServer} from "http"
import {Server} from "socket.io"
import {YSocketIO} from "y-socket.io/dist/server"
import {config} from "dotenv"



const app= express();

app.use(express.static("public"))// backend serve all thing that are inside the public filder
const httpServer= createServer(app);
config({ path: "./.env" })
const port= process.env.PORT || 3000;
const io= new Server(httpServer,{
    cors:{
        origin:"*",
        methods:["POST","GET"]
    }
})

const ySocketIO= new YSocketIO(io)
ySocketIO.initialize() // server are complete on server side 





app.get("/health",(req,resp)=>{// this route use for the check Dashbor ,server heath in Aws 
    resp.status(200).json({
        message:"ok",
        success:true
    })
})

httpServer.listen(port,()=>{
    console.log(`Server is Running on port No :- ${port}`)
})