const { response } = require('express');
const asyncHandeler = require('express-async-handler');
const Chat = require('../Models/chatModel');
const User = require('../Models/userModel');





const accessChat = asyncHandeler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        console.log("UserId params not sent with request")
        return res.sendStatus(400);
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: req.user._id } } },
            { users: { $elemMatch: { $eq: userId } } }
        ]
    }).populate("users", "-password").populate('latestMessage');

    isChat = await User.populate(isChat, {
        path: 'latestMessage.sender',
        select: 'name pic email',
    });

    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        var chatData = {
            chatName: 'sender',
            isGroupChat: false,
            users: [req.user._id, userId]
        }
        try {
            const createChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createChat._id }).populate("users", "-password");
            res.status(200).send(fullChat);
        } catch (err) {
            res.status(400);
            throw new Error(err.message);
        }
    }
})


const fetchChat = asyncHandeler(async (req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
            .populate('users', '-passowrd')
            .populate('groupAdmin', '-password')
            .populate('latestMessage')
            .sort({ updatedAt: -1 })
            .then(async (result) => {
                result = await User.populate(result, {
                    path: 'latestMessage sender',
                    select: 'name pic email'
                })

                res.status(200).send(result)
            })
    } catch (error) {
        res.status(400);
        throw new Error(error.message)
    }
})

const createGroupChat = asyncHandeler(async (req, res) => {
    if (!req.body.users || !req.body.name) {
        return res.status(400).send({ message: 'please fill all the fields' })
    }

    var users = JSON.parse(req.body.users);

    if (users.length < 2) {
        return res.status(400).send("more than 2 users are require to create group");
    }

    users.push(req.user);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin: req.user
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id }).populate('users', '-password').populate('groupAdmin', "-password");
        res.status(200).json(fullGroupChat);
    } catch (error) {
        res.status(400);
        throw new Error(error.message)
     }
})

const renameGroup=asyncHandeler(async(req,res)=>{
    const {chatId, chatName}=req.body
    const updateChat=await Chat.findByIdAndUpdate(chatId,{
        chatName
    },
    {
        new:true
    }).populate('users', "-password").populate('groupAdmin',"-password");

    if(!updateChat){
        res.status(404);
        throw new Error('chat not found')
    }else{
        res.json(updateChat)
    }
})

const addToGroup=asyncHandeler(async(req,res)=>{
    const {chatId,userId}=req.body;

    const added=await Chat.findByIdAndUpdate(chatId,{
        $push:{users:userId},
    },
    {new:true}
    ).populate('users','-password').populate('groupAdmin','-password');
    if(!added){
        res.status(404);
        throw new Error('chat not found');
    }else{
        res.json(added)
    }
})

const removeFromGroup=asyncHandeler(async(req,res)=>{
    const {chatId, userId}=req.body;

    const remove=await Chat.findByIdAndUpdate(
        chatId,{
            $pull:{users:userId},
        },
        {new:true}
    ).populate('users', "-password").populate('users', '-password');
    if(!remove){
        res.status(404);
        throw new Error('chat not found');
    }else{
        res.json(remove)
    }
})

module.exports = { accessChat, fetchChat,createGroupChat,renameGroup,addToGroup, removeFromGroup }