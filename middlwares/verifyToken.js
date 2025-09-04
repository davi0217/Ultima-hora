import jwt from 'jsonwebtoken'


export const verifyToken = function(req, res, next){
   
    const privateKey="dav0217"
      
    try{

        let token
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
                token=req.headers.authorization.split(' ')[1]
        }
        
        jwt.verify(token, privateKey, {"algorithms":["HS256"] }, function(err, decoded){
        if(err){
            console.log(`error verifying your token: ${err}`)
        }
        req.validationInfo= decoded
    })}catch(error){
        console.log(`could not validate your token: ${error.message}`)
    }
    
    next()
}