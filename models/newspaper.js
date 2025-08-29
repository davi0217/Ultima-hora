import express from 'express'
import bcrypt from 'bcrypt'
import mysql from 'mysql2/promise'
import {validateUser} from '../utils/validateUser.js'
import { id } from 'zod/v4/locales'
import { _isoDateTime } from 'zod/v4/core'

const config={
   "host":"localhost",
   "port":3308,
    "user":"root",
    "password":'',
    "database":"newspaper"
}


const connection=await mysql.createConnection(config)


export class NewspaperModel{

    static getAll=async function(){

        const [results, fields]=await connection.query('SELECT username, user_password FROM news_user')

        return results
    }

    static register=async function(user){

        const userResult=validateUser(user)

        if(userResult.error){
            return `The user is not in the right format`
        }

        try{
           
            const hashedPassword=await bcrypt.hash(user.user_password, 6)
            const newUser={...user, "user_password":hashedPassword}
          
            const newId=await connection.query('SELECT (UUID_TO_BIN(UUID()))')

            //la conexion nos devuelve una tupla de objetos, esta es la forma de saber cual es la key del objeto 0 de la tupla (es "UUID()")
            const idToPass=newId[0][0][Object.keys(newId[0][0]).toString()]

            const date=new Date()
            const actualDate=`${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`

            const [results, fields]=await connection.query(
                'INSERT INTO news_user(id, username, user_password, creation_date, country, city, email, image, name, surname) VALUES (?,?,?,?,?,?,?,?,?,?)',
                [idToPass, newUser.username, newUser.user_password, actualDate  , newUser.country, newUser.city, newUser.email, newUser.image, newUser.name, newUser.surname] 
            )

            return newId

        }catch(error){
                console.error(`your insertion provoked an error: ${error.message}`)
        }

    }

    static login =async function(info){

      try{ 
        const users=await connection.query('SELECT username, user_password FROM news_user')
       
        const logUser= users[0].some( (user)=>{
            const passwordOk= bcrypt.compareSync(info.user_password, user.user_password)
            return ((user.username==info.username) && passwordOk)
        })

        return logUser?{"message":"login succesful"}:{"message":"failed to log in"}
    }catch(error){
            return `error: ${error.message}`
        }

    }
}