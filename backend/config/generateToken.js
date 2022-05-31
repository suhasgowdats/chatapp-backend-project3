const JWT=require('jsonwebtoken');

const generateToken=(id)=>{
    return JWT.sign({id},process.env.jwt_secreat,{expiresIn:'31d'})
}

module.exports=generateToken;