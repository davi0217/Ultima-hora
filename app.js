import express from 'express'
import cors from 'cors'



import {NewspaperRouter} from './views/newspaper-routes.js'
import {verifyToken} from './middlwares/verifyToken.js'

const app=express()

const PORT =3000


app.use(cors())

app.use(verifyToken)

app.use('/static',express.static('static') )

app.use(express.json())


app.use(NewspaperRouter)

app.listen(PORT, ()=>{
    console.log(`server listening on port ${PORT}`)
})