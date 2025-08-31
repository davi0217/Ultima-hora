import jwt from 'jsonwebtoken'

const token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoibWlrbyIsImlhdCI6MTc1NjY1ODY3MywiZXhwIjoxNzU2NjYyMjczfQ.AxKUlJOmN1cIdPD3uNowvR1SDzXp-HrEfr_njZ-uG5M"

export const verifyToken = function(req, res, next){
   
    const privateKey="dav0217"
    req.headers["authorization"]= `Bearer <${token}>`
    try{jwt.verify(token, privateKey, {"algorithms":["HS256"] }, function(err, decoded){
        if(err){
            console.log(`error verifying your token: ${err}`)
        }
        req.validationInfo= decoded
    })}catch(error){
        console.log(`could not validate your token: ${error.message}`)
    }
    
    next()
}