import express from 'express'
import bcrypt from 'bcrypt'
import mysql from 'mysql2/promise'
import {validateUser} from '../utils/validateUser.js'
import {validateNews} from '../utils/validateNews.js'
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
    
    static getDate=function(){
        const date=new Date()
         const  actualDate=`${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`
        return actualDate
    }

    static  getId=async function(){
            const newId=await connection.query('SELECT (UUID_TO_BIN(UUID()))')

            //la conexion nos devuelve una tupla de objetos, esta es la forma de saber cual es la key del objeto 0 de la tupla (es "UUID()")
            const idToPass=newId[0][0][Object.keys(newId[0][0]).toString()]

            return idToPass
    }

    static getIdFromName=async function(table, name){

        if(table=="news_user"){
            const userUUID=await connection.query(
                'SELECT BIN_TO_UUID(id) AS id FROM news_user WHERE username=?',
                [ name]
            )
        return userUUID[0][0].id
    }
        if(table=="news_group"){
            const userUUID=await connection.query(
                'SELECT BIN_TO_UUID(id) AS id FROM news_group WHERE name=?',
                [ name]
            )
        return userUUID[0][0].id
        }

        if(table=="headers"){
            const userUUID=await connection.query(
                'SELECT BIN_TO_UUID(id) AS id FROM headers WHERE name=?',
                [ name]
            )
        return userUUID[0][0].id
        }
        if(table=="news_section"){
            const userUUID=await connection.query(
                'SELECT BIN_TO_UUID(id) AS id FROM news_section WHERE name=?',
                [ name]
            )
        return userUUID[0][0].id
        }
}
   
    static getAll=async function(){

        const [results, fields]=await connection.query('SELECT * FROM news')

        return results
    }

    static register=async function(user){

        const userResult=await validateUser(user)

        if(userResult.error){
            return `The user is not in the right format ${userResult.error}`
        }

        try{
           
            const hashedPassword=await bcrypt.hash(user.user_password, 6)
            const newUser={...user, "user_password":hashedPassword}
          

            //la conexion nos devuelve una tupla de objetos, esta es la forma de saber cual es la key del objeto 0 de la tupla (es "UUID()")
            const idToPass=await this.getId()


            const [results, fields]=await connection.query(
                'INSERT INTO news_user(id, username, user_password, creation_date, country, city, email, image, name, surname) VALUES (?,?,?,?,?,?,?,?,?,?)',
                [idToPass, newUser.username, newUser.user_password, this.getDate()  , newUser.country, newUser.city, newUser.email, newUser.image, newUser.name, newUser.surname] 
            )

            return idToPass

        }catch(error){
                console.error(`your insertion provoked an error: ${error.message}`)
        }

    }

    static login =async function(info){

        const {username, user_password}=info
        
      try{ 
        const users=await connection.query('SELECT username, user_password FROM news_user')
       
        const logUser= users[0].some( (user)=>{
            const passwordOk= bcrypt.compareSync(user_password, user.user_password)
            return ((user.username==username) && passwordOk)
        })

        return logUser?{"message":"login succesful"}:{"message":"failed to log in"}
    }catch(error){
            return `error: ${error.message}`
        }

    }

    static createGroup=async function(info){

        const {name}=info
        const id=await this.getId()

        const newGroup={"id":id, "name":name, "creation_date":this.getDate()}

       try{ const result=await connection.query(
            'INSERT INTO news_group(id, name, creation_date) VALUES (?, ?, ?)',
            [newGroup.id, newGroup.name, newGroup.creation_date]
        )
        let newUserGroup;

         try{

            //!!!!!este es el id que hay que cambiar por el obtenido de jwt 
            const userUUID=await this.getIdFromName("news_user","pedro")
           
            const userGroupId= await this.getId()

            newUserGroup=await connection.query(
                'INSERT INTO user_groups(id, user_id, group_id, isAdmin) VALUES (?,UUID_TO_BIN(?),?,?)',
                [userGroupId, userUUID, newGroup.id, true ]
            ) 
        }catch(error){
            console.log(`your user could not be registered as part of the group: ${error.message}`)
        }

        return {"creation-group":result, "usergroup-registered":newUserGroup}}catch(error){
            console.log(`your group could not be created: ${error.message}`)
        }

        //en cuanto tengamos el grupo, tenemos que registrar al usuario que lo ha creado como admin del grupo en user_groups
        //para eso, recurriremos al user_id de jwt, que tenemos que implementar
        //por el momento, recurriremos a id permanente para hacer la prueba
 
    }

    static createHeader=async function(info){

        const {name, isPublic}=info

        const groupUUID=await this.getIdFromName("news_group", "Pipiolas")
        const headerId=await this.getId()

        try{
            const createHeader=await connection.query(
                'INSERT INTO headers(id, group_id,name, date, public ) VALUES(?,UUID_TO_BIN(?),?,?,?)',
                [headerId, groupUUID,name,this.getDate(), isPublic]
            )

            return createHeader

        }catch(error){
            console.log(`your header could not be inserted: ${error.message}`)
        }
        
    }


    static publishNews=async function(info){



        const validation=await validateNews(info)


        if(validation.error){
            console.log(`there was an error in the format of your news: ${validation.error}`)
        }
      try{  
        
        const {header, section}=info
        console.log(header)
        console.log(section)
        const userId=await this.getIdFromName("news_user", "pedro")
        console.log(`userID is: ${userId}`)
        const headerId=await this.getIdFromName("headers", header)
        console.log(`headerID is: ${headerId}`)
        const sectionId=await this.getIdFromName("news_section", section)
        console.log(`sectionID is: ${sectionId}`)
        const newsId=await this.getId()
        console.log(`newsID is: ${newsId}`)
        const news_date=this.getDate()

        const publishNews=await connection.query(
            'INSERT INTO news (id, user_id, header_id, section_id, image, creation_date, title, subtitle, content, caption) VALUES (?,UUID_TO_BIN(?),UUID_TO_BIN(?),UUID_TO_BIN(?),?,?,?,?,?,?)',
            [newsId, userId, headerId, sectionId, info.image, news_date, info.title, info.subtitle, info.content, info.caption]
        )

        return publishNews}catch(error){
            console.log(`could not insert your news: ${error.message}`)
        }
        
        

    }

}