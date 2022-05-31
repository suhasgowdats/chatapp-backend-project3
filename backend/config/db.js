const mongoose=require('mongoose')

const dbConnect=async()=>{
    try{
        const conn= await mongoose.connect(process.env.MONGO_URL)
        console.log(`Mongodb connected:${conn.connection.host}`.green.bold)
    }catch(err){
        console.log(`error:${err.message}`.red.bold);
        process.exit()
    }
}

module.exports=dbConnect;

