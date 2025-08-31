import express from 'express'

import {NewspaperRouter} from './views/newspaper-routes.js'
import {verifyToken} from './middlwares/verifyToken.js'

const app=express()

const PORT =3000

app.use(verifyToken)

app.use(express.json())


app.use(NewspaperRouter)

app.listen(PORT, ()=>{
    console.log(`server listening on port ${PORT}`)
})