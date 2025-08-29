import express from 'express'

import {NewspaperRouter} from './views/newspaper-routes.js'

const app=express()

const PORT =3000

app.use(express.json())

app.use(NewspaperRouter)

app.listen(PORT, ()=>{
    console.log(`server listening on port ${PORT}`)
})