import express from 'express'
import cors from 'cors'
import { env } from 'process' 

import {NewspaperRouter} from './views/newspaper-routes.js'
import {verifyToken} from './middlwares/verifyToken.js'
import * as dotenv from 'dotenv'
import path from 'path'



const app=express()
dotenv.config()

const PORT =process.env.PORT??3000

app.use(cors())


app.use(verifyToken)


app.use('/static',express.static(path.join(process.cwd(), 'static'))) 

app.use(express.json())


app.use(NewspaperRouter)

app.listen(PORT, ()=>{
    console.log(`server listening on port ${PORT}`)
})