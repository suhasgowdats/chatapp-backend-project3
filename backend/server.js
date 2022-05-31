const express=require('express')
const dotenv=require('dotenv');
const chats = require('./data/data');
const cors=require('cors');
const colors=require('colors')
const dbConnect = require('./config/db');
const userRoutes=require('./routes/userRoutes')
const chatRoutes=require('./routes/chatRoutes')
const messageRouters=require('./routes/messageRoutes')
const {notFound, errorHandler}=require('./middleWare/errorMiddleware')

const app=express();
dotenv.config();
dbConnect();

app.use(cors())
app.use(express.json())

app.get('/', (req,res)=>{
    res.send("running in chart app")
})

app.use('/api/user', userRoutes)
app.use('/api/chats',chatRoutes)
app.use('/api/message',messageRouters)


app.use(notFound);
app.use(errorHandler)

const port= process.env.PORT || 5000

const server= app.listen(port , console.log("server running successfully",port))

console.log("this port is",process.env.port)

const io=require('socket.io')(server,{
    // pingTimeout:60000,
    // http://localhost:3000
    cors:{
        origin:'*',
    }
})

io.on('connection',(socket)=>{
    console.log('connected to socket.io');

    socket.on('setup',(userData)=>{
        socket.join(userData._id);
        socket.emit('connected');
    })

    socket.on('join chat', (room)=>{
        socket.join(room);
        console.log("User joined room:"+room)
    });

    socket.on("typing", (room)=>socket.in(room).emit('typing'));
    socket.on("stop typing",(room)=>socket.in(room).emit('stop typing'))

    socket.on('new message', (newMessageRecived)=>{
        var chat = newMessageRecived.chat;

        if(!chat.users) return console.log('chat.users not found')

        chat.users.forEach(user=>{
            if(user._id== newMessageRecived.sender._id) return;

            socket.in(user._id).emit('message recived', newMessageRecived)
        })
    })
    socket.off('setup',()=>{
        console.log('USER DISCONNECTED')
        socket.leave(userData._id);
    })
})