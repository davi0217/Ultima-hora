import express from 'express'
import bcrypt from 'bcrypt'
import process from 'process'
import * as dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'
import {validateUser} from '../utils/validateUser.js'
import {validateNews} from '../utils/validateNews.js'
import { id } from 'zod/v4/locales'
import { _isoDateTime } from 'zod/v4/core'
import { group } from 'console'



dotenv.config()
 const config={
    "host":process.env.DB_HOST,
    "port":10445,
    "user":"avnadmin",
    "password":process.env.DB_PASSWORD,
    "database":"defaultdb"
}  


const connection=await mysql.createConnection(config)


export class NewspaperModel{

    static createToken=async function(username){
    const privateKey=process.env.JWT_KEY
        
        
    let tokenToPass= jwt.sign(
            {user:username},privateKey, {algorithm: 'HS256',expiresIn:'3h', allowInsecureKeySizes:true}
        )

        return tokenToPass
    }
    
    static getDate=function(){
        const date=new Date()
         const  actualDate=`${date.getFullYear()}-${date.getMonth()+1}-${date.getDay()+1} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
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
   
static getTagsFromNews=async function(news_id){

            let tags;

            if(typeof(news_id)=="object"){
            tags=await connection.query('SELECT tag_id as tagId FROM news_tags WHERE news_id=?',
                [news_id]
            ) 
        }
            if(typeof(news_id)=="string"){
            tags=await connection.query('SELECT tag_id as tagId FROM news_tags WHERE news_id=UUID_TO_BIN(?)',
                [news_id]
            ) 
        }
        console.log(tags)
            let tagsToShow=[]
            if(tags){
            for(let t of tags[0]){

                console.log(t.tagId)
               
                let tagToAdd=await connection.query(
                    'SELECT name FROM tags WHERE id=?',
                    [t.tagId]
                )

                console.log(tagToAdd)
                if(tagToAdd){
                 await tagsToShow.push(tagToAdd[0][0].name)}
            }}

            return tagsToShow
}
    

    static register=async function(req){

        console.log(req.file.path)
        console.log()
        const userInfo={...JSON.parse(req.body.info), 'image':req.file.path}
        console.log(userInfo)
        const userResult=await validateUser(userInfo)

        if(userResult.error){
            return `The user is not in the right format ${userResult.error}`
        }

        try{
           
            const hashedPassword=await bcrypt.hash(userInfo.user_password, 6)
            const newUser={...userInfo, "user_password":hashedPassword}
          

            //la conexion nos devuelve una tupla de objetos, esta es la forma de saber cual es la key del objeto 0 de la tupla (es "UUID()")
            const idToPass=await this.getId()


            const [results, fields]=await connection.query(
                'INSERT INTO news_user(id, username, user_password, creation_date, country, city, email, image, name, surname) VALUES (?,?,?,?,?,?,?,?,?,?)',
                [idToPass, newUser.username, newUser.user_password, this.getDate()  , newUser.country, newUser.city, newUser.email, newUser.image, newUser.name, newUser.surname] 
            )

            const newToken=await this.createToken(newUser.username)

            return {token:newToken}

        }catch(error){
                return {message:`your insertion provoked an error: ${error.message}`}
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

        if(logUser){
       try{const token=await this.createToken(username) 

        return logUser?{token:token}:""

       } catch(error){
        return {message:`we couldnt create your token: ${error.message}`}
       }
    }

    }catch(error){
            return `error: ${error.message}`
        }

    }

    static createGroup=async function(info){

        const {name}=info.body
        const id=await this.getId()

        const newGroup={"id":id, "name":name, "creation_date":this.getDate()}

       try{ const result=await connection.query(
            'INSERT INTO news_group(id, name, creation_date) VALUES (?, ?, ?)',
            [newGroup.id, newGroup.name, newGroup.creation_date]
        )
        let newUserGroup;

         try{

            //!!!!!este es el id que hay que cambiar por el obtenido de jwt 
            const userUUID=await this.getIdFromName("news_user",info.validationInfo?.user)
           
            const userGroupId= await this.getId()

            newUserGroup=await connection.query(
                'INSERT INTO user_groups(id, user_id, group_id, isAdmin) VALUES (?,UUID_TO_BIN(?),?,?)',
                [userGroupId, userUUID, newGroup.id, true ]
            ) 
        }catch(error){
            return {message:`your user could not be registered as part of the group: ${error.message}`}
        }

        return {"creation-group":result, "usergroup-registered":newUserGroup}}catch(error){
            return {message:`your group could not be created: ${error.message}`}
        }

        //en cuanto tengamos el grupo, tenemos que registrar al usuario que lo ha creado como admin del grupo en user_groups
        //para eso, recurriremos al user_id de jwt, que tenemos que implementar
        //por el momento, recurriremos a id permanente para hacer la prueba
 
    }

    static addToGroup=async function(info){
        const {name, group}=info.body
       
        const groupId=await this.getIdFromName("news_group", group)
      
        const userAddedId=await this.getIdFromName("news_user", name)
        const userLoggedInId=await this.getIdFromName("news_user", info.validationInfo?.user)
        const userGroupId=await this.getId()

        const [alreadyIn]=await connection.query(
            'SELECT id FROM user_groups WHERE (group_id=UUID_TO_BIN(?) AND user_id=UUID_TO_BIN(?))',
            [groupId, userAddedId]
        )

        if(alreadyIn[0]?.id){
            return 'Your user is already in the group'
        }

        const [loggedUserIsAdmin]=await connection.query(
            'SELECT isAdmin FROM user_groups WHERE (group_id=UUID_TO_BIN(?) AND user_id=UUID_TO_BIN(?))',
            [groupId, userLoggedInId]
          
        )
       
        if(loggedUserIsAdmin[0]?.isAdmin==1){
        const addUser=await connection.query(
            'INSERT INTO user_groups (id, user_id, group_id, isAdmin ) VALUES (?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?)',
            [userGroupId, userAddedId, groupId, false]
        )

        return {message:'Your user was added correctly'}}else{
                return  {message:'We could not add your user'}
        }
    }

    static createHeader=async function(info){

        const {name, isPublic, group, description}=info.body

        const groupUUID=await this.getIdFromName("news_group", group)
        const headerId=await this.getId()

        try{
            const createHeader=await connection.query(
                'INSERT INTO headers(id, group_id,name, date, public, description ) VALUES(?,UUID_TO_BIN(?),?,?,?,?)',
                [headerId, groupUUID,name,this.getDate(), isPublic, description]
            )

            return createHeader

        }catch(error){
            console.log(`your header could not be inserted: ${error.message}`)
        }
        
    }


    static publishNews=async function(info){


        let validation=await validateNews(JSON.parse(info.body.info))


        if(validation.error){
            
            return {message:validation.error} 
        }
        try{  
            validation={...JSON.parse(info.body.info), 'image':info.file.path}

            console.log(validation)
        
        const {header, section}=validation
       
        const userId=await this.getIdFromName("news_user", info.validationInfo?.user)
     
        const headerId=await this.getIdFromName("headers", header)

        const [group]=await connection.query(
            'SELECT group_id as gi FROM headers WHERE id=UUID_TO_BIN(?)',
            [headerId]
        )

        const [isUserInGroup]=await connection.query(
            'SELECT user_id as ui FROM user_groups WHERE group_id=? AND user_id=UUID_TO_BIN(?)',
            [group[0].gi, userId]
        )


        if(!isUserInGroup[0]?.ui){
            return `Your user is not allowed to publish news in this header`
        }
   
        const sectionId=await this.getIdFromName("news_section", section)
        
        const newsId=await this.getId()
        
        const news_date=await this.getDate()
        const publishNews=await connection.query(
            "INSERT INTO news (id, user_id, header_id, section_id, image, creation_date, title, subtitle, content, caption) VALUES (?,UUID_TO_BIN(?),UUID_TO_BIN(?),UUID_TO_BIN(?),?,?,?,?,?,?)",
            [newsId, userId, headerId, sectionId, validation.image, news_date, validation.title, validation.subtitle, validation.content, validation.caption]
        )
       

        try{
            const {tags}=validation

            await tags.forEach(async (t)=>{
                const tagId=await this.getId()
                const createTag=await connection.query(
                    'INSERT INTO tags (id, name) VALUES (?,?)',
                    [tagId, t]
                )
                const newsTagId=await this.getId()
                const createNewsTags=await connection.query(
                    'INSERT INTO news_tags(id, tag_id, news_id) VALUES(?,?,?)',
                    [newsTagId, tagId, newsId]
                )
                        
            })
        }catch(error){
            console.log(`tag could no be inserted: ${error.message}`)
        }
      
        const newsIdBin=await connection.query(
            'SELECT BIN_TO_UUID(?) AS id',
            [newsId]
        )

        console.log(newsIdBin)
        return {newsId:newsIdBin[0]}
    
    }catch(error){
            console.log(`could not insert your news: ${error.message}`)
        }    
    }


    static likeNews=async function(info){

        const {newsId}=info.body
        const likeId=await this.getId()

        const userId=await this.getIdFromName("news_user", info.validationInfo?.user)

        try{
            const checkLike=await connection.query(
                'SELECT BIN_TO_UUID(user_id) as ui, BIN_TO_UUID(news_id) as ni FROM likes'
            )

            

            for(let like of checkLike[0]){

                    if(like.ui==userId && like.ni==newsId){
                        return {message: `The user has already liked the news`}
                    }
            }
           

            const createLike=await connection.query(
                'INSERT INTO likes(id, user_id, news_id) VALUES (?, UUID_TO_BIN(?), UUID_TO_BIN(?))',
                [likeId, userId, newsId]
            )
            return {message:`liked was inserted with id: ${likeId}`}
        }catch(error){
            return {message:`like could not be inserted: ${error.message}`}
        }


    }
    static leaveComment=async function(info){

        const {newsId, comment}=info.body
        const commentId=await this.getId()

        const userId=await this.getIdFromName("news_user", info.validationInfo.user)

        try{
            const createComment=await connection.query(
                'INSERT INTO comments(id, user_id, news_id, content) VALUES (?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?)',
                [commentId, userId, newsId, comment]
            )
            return {message:`comment was inserted with id: ${commentId}`}
        }catch(error){
            return {message:`like could not be inserted: ${error.message}`}
        }


    }


    static getAllUsers=async function(){
        
        const [results, fields]=await connection.query('SELECT * FROM news_user ')

        let infoToShow=[]

        for(let r of results){

            const [userId]=await connection.query(
             'SELECT BIN_TO_UUID(?) as id',
             [r.id]
            )

            let userToPass={
                id:userId[0],
                username:r.username,
                name:r.name,
                surname:r.surname,
                city:r.city,
                country:r.country,
                image:r.image,
                date:r.creation_date,
                description:r.description
            }

            infoToShow.push(userToPass)
        }
        return infoToShow
    }
    static getUserLogged=async function(info){

        const username=info.validationInfo?.user
        

        
       try{ const [results, fields]=await connection.query('SELECT *, image as image FROM news_user WHERE username=? ',
            [username]
        )


        let infoToShow=[]

        for(let r of results){

            const [userId]=await connection.query(
             'SELECT BIN_TO_UUID(?) as id',
             [r.id]
            )

            let userToPass={
                id:userId[0],
                username:r.username,
                name:r.name,
                surname:r.surname,
                city:r.city,
                country:r.country,
                image:r.image,
                date:r.creation_date,
                description:r.description
            }

            infoToShow.push(userToPass)
        }
        return infoToShow[0]}catch(error){
            return {message:error.message}
        }
    }
    static getUserByName=async function(info){

        const username=info.query.username
        

        
        try{const [results, fields]=await connection.query('SELECT *, image FROM news_user WHERE username=? ',
            [username]
        )


        let infoToShow=[]

        for(let r of results){

            const [userId]=await connection.query(
             'SELECT BIN_TO_UUID(?) as id',
             [r.id]
            )

            let userToPass={
                id:userId[0],
                username:r.username,
                name:r.name,
                surname:r.surname,
                city:r.city,
                country:r.country,
                image:r.image,
                date:r.creation_date,
                description:r.description
            }

            infoToShow.push(userToPass)
        }
        return infoToShow[0]}catch(error){
            return {message:error.message}
        }
    }
    static getAllGroups=async function(){
        
        const [results, fields]=await connection.query('SELECT * FROM news_group')

        return results
    }
    static getGroupFromUsername=async function(info){

       
        const username=info.query.username
        const userLogged=info.validationInfo?.user

        try{const userId=await this.getIdFromName("news_user", username)
        
        const [results, fields]=await connection.query('SELECT * FROM user_groups WHERE user_id=UUID_TO_BIN(?)',
            [userId]
        )

        let groupsToPass=[]


        for(let r of results){
           


        const [groupName]=await connection.query(
          'SELECT name FROM news_group WHERE id=?',
            [r.group_id])

            
        const [header]=await connection.query(
          'SELECT name, public, description FROM headers WHERE group_id=?',
            [r.group_id])
            

            if(header[0]?.public==0 || !header[0]){
                
                if (username!=userLogged){
                    continue
                }
            }

            let newGroupInfo={
                groupName:groupName[0].name,
                headerName:header[0]?.name?header[0].name:'',
                headerDescription:header[0]?.description?header[0].description:'',
            }
           
            groupsToPass.push(newGroupInfo)
        }

        return groupsToPass}catch(error){
                return {error:error.message}
        }


    }

    static getUserGroupsByGroup=async function(info){
        
        if(info.query.group){

          try{const groupId= await this.getIdFromName("news_group", info.query.group)

            const[result]=await connection.query(
                'SELECT BIN_TO_UUID(user_id) as ui, isAdmin as admin FROM user_groups WHERE group_id=UUID_TO_BIN(?) ',
                [groupId]
            )

            let groupInfoToShow=[];

            for(let r of result){

                const [userInfo]=await connection.query(
                    'SELECT username, image FROM news_user WHERE id=UUID_TO_BIN(?)',
                    [r.ui]
                )

                let newInfoToPass={
                    "name":userInfo[0].username,
                    "image":userInfo[0].image,
                    "admin":r.admin==1?true:false
                }

                groupInfoToShow.push(newInfoToPass)
                
            }
            return groupInfoToShow
        
        }catch(error){
                return({"message":`error: could not get info grom groups: ${error.message}`})
            }
        }else{

           try{ 
            
            const[groups]=await connection.query(
                'SELECT name as gn FROM news_group ',     
            )

            let groupsFullData=[]


            for(let g of groups){

                const groupId= await this.getIdFromName("news_group", g.gn)
            

                const[result]=await connection.query(
                    'SELECT BIN_TO_UUID(user_id) as ui, isAdmin as admin FROM user_groups WHERE group_id=UUID_TO_BIN(?) ',
                     [groupId]
                    )
                let groupInfoToShow=[];
    
                for(let r of result){
    
                    const [userInfo]=await connection.query(
                        'SELECT username, image FROM news_user WHERE id=UUID_TO_BIN(?)',
                        [r.ui]
                    )
    
                    let newInfoToPass={
                        "name":userInfo[0].username,
                        "image":userInfo[0].image,
                        "admin":r.admin==1?true:false
                    }
    
                    groupInfoToShow.push(newInfoToPass)
                    
                }
                groupsFullData.push({
                    "groupName":g.gn,
                    "members":groupInfoToShow
                })
            }

            return groupsFullData
        
        }catch(error){
                return({"message":`error: could not get info grom groups: ${error.message}`})
            }

        }




    }
    static getAllHeaders=async function(){
        
        const [results, fields]=await connection.query('SELECT * FROM headers ')

        let infoToPass=[]

        try{for(let r of results){
         

            const [group]=await connection.query(
                'SELECT name as gn FROM news_group where id=?',
                [r.group_id]
            )

            let headerToPass={
                "name":r.name,
                "group":group[0].gn,
                "public":r.public==0?false:true,
                "creation":r.date,
                "description":r.description
            }

            infoToPass.push(headerToPass)

        }

        return {headers:infoToPass}}catch(error){
            return {message:error.message}
        }
    }
    static getAllSections=async function(){
        
        const [results, fields]=await connection.query('SELECT * FROM news_section')



        return results
    }
  


    static getNewsBySectionAndHeader=async function(info){

        
        const validates=info.validationInfo?.user
        
        let queryResult;

       try{ if(info.query.id){

            queryResult=await connection.query(
                  'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.creation_date as date, a.subtitle as subtitle,a.caption as caption,a.content as content, a.image as image,b.username as username, c.name as header,c.id as header_id,d.name as section from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id WHERE a.id=UUID_TO_BIN(?) ORDER BY a.creation_date DESC',
                  [info.query.id]
            )


        }else if(info.query.section || info.query.header){
            
                if(!info.query.section || !info.query.header){

                    
                    let queryToPass=info.query.section?info.query.section:info.query.header
                    
                    if(info.query.section){
                    queryResult=await connection.query(
                    'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.creation_date as date, a.subtitle as subtitle,a.caption as caption,a.content as content,a.image as image,b.username as username, c.name as header, c.id as header_id,d.name as section from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id where (d.name=? OR d.name="Opinión") ORDER BY a.creation_date DESC',
                     [queryToPass]
                        )}else{
                    queryResult=await connection.query(
                    'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.creation_date as date, a.subtitle as subtitle,a.caption as caption,a.content as content,a.image as image,b.username as username, c.name as header,c.id as header_id,d.name as section from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id where c.name=? ORDER BY a.creation_date DESC',
                     [queryToPass]
                        )}



                        
                }else{
                    
                            const {section, header}=info.query
                        queryResult=await connection.query(
                    'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.creation_date as date, a.subtitle as subtitle,a.caption as caption,a.content as content,a.image as image,b.username as username, c.name as header,c.id as header_id,d.name as section from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id where (d.name=? OR d.name="Opinión") and c.name=? ORDER BY a.creation_date DESC',
                    [section, header]
                        )}
    
                }else{
                    queryResult=await connection.query(
                        'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.creation_date as date, a.subtitle as subtitle,a.caption as caption,a.content as content, a.image as image,b.username as username, c.name as header,c.id as header_id,d.name as section from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id ORDER BY a.creation_date ASC',
                    )

                }

        if(validates){

            let publicFilteredNews=[]
            for(let query of queryResult[0]){
                const tagsToShow= await this.getTagsFromNews(query.news_id)
               
                const [headerResult]=await connection.query(
                    'SELECT public as public from headers where id=?',
                    [query.header_id]
                )
                
             if(headerResult[0].public==1){
                
                let newPublicNews={
                    ...query,
                    tags:tagsToShow
                }
              
                publicFilteredNews.push(newPublicNews)
            }else{
                console.log(query)
                const [groupId]=await connection.query(
                    'SELECT group_id as gid FROM headers WHERE id=?',
                    [query.header_id]
                )

                console.log('gid is '+groupId[0].gid)
                console.log(info.validationInfo.user)
                const userId=await this.getIdFromName("news_user", info.validationInfo.user)
                console.log(userId)
                const [validateUser]=await connection.query(
                    'SELECT BIN_TO_UUID(user_id) as ui FROM user_groups WHERE group_id=?',
                    [ groupId[0].gid]
                )

                let publicNewsAnyway=validateUser.some((v)=>{
                    return v.ui==userId

                })

                if(publicNewsAnyway){
                let newPublicNews={
                    ...query,
                    tags:tagsToShow
                }
              
                publicFilteredNews.push(newPublicNews)
                }

                continue
                }
            
            }
            return publicFilteredNews

        }else{
            
            let privateFilteredNews=[]
            
            
            for(let query of queryResult[0]){
                const tagsToShow=await this.getTagsFromNews(query.news_id)       

                
                const [headerResult]=await connection.query(
                    'SELECT public as public from headers where id=?',
                    [query.header_id]
                )

                

             if(headerResult[0].public==1){let newPrivateNews={
                    ...query,
                    content:query.content.slice(0,400),
                    tags:tagsToShow
                }
                privateFilteredNews.push(newPrivateNews)}else{
                    continue
                }

            }

            return privateFilteredNews
        }}catch(error){
            return {message:`${error.message}`}
        }

    }
    static getMostLikedNews=async function(info){

        
        const validates=info.validationInfo?.user
        
        let queryResult;

        
            queryResult=await connection.query(
                'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.creation_date as date, a.subtitle as subtitle,a.caption as caption,a.content as content, a.image as image,b.username as username, c.name as header,c.id as header_id,d.name as section , COUNT(*) as total_likes from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id join likes on a.id=likes.news_id group by a.id ORDER BY COUNT(*) desc;'  
            )


        

        if(validates){

            let publicFilteredNews=[]
            for(let query of queryResult[0]){
                const tagsToShow= await this.getTagsFromNews(query.news_id)
               
                const [headerResult]=await connection.query(
                    'SELECT public as public from headers where id=?',
                    [query.header_id]
                )
                
             if(headerResult[0].public==1){
                
                let newPublicNews={
                    ...query,
                    tags:tagsToShow
                }
              
                publicFilteredNews.push(newPublicNews)
            }else{
                console.log(query)
                const [groupId]=await connection.query(
                    'SELECT group_id as gid FROM headers WHERE id=?',
                    [query.header_id]
                )

                console.log('gid is '+groupId[0].gid)
                console.log(info.validationInfo.user)
                const userId=await this.getIdFromName("news_user", info.validationInfo.user)
                console.log(userId)
                const [validateUser]=await connection.query(
                    'SELECT BIN_TO_UUID(user_id) as ui FROM user_groups WHERE group_id=?',
                    [ groupId[0].gid]
                )

                let publicNewsAnyway=validateUser.some((v)=>{
                    return v.ui==userId

                })

                if(publicNewsAnyway){
                let newPublicNews={
                    ...query,
                    tags:tagsToShow
                }
              
                publicFilteredNews.push(newPublicNews)
                }

                continue
                }
            
            }
            return publicFilteredNews

        }else{
            
            let privateFilteredNews=[]
            
            
            for(let query of queryResult[0]){
                const tagsToShow=await this.getTagsFromNews(query.news_id)       

                
                const [headerResult]=await connection.query(
                    'SELECT public as public from headers where id=?',
                    [query.header_id]
                )

                

             if(headerResult[0].public==1){let newPrivateNews={
                    ...query,
                    content:query.content.slice(0,200),
                    tags:tagsToShow
                }
                privateFilteredNews.push(newPrivateNews)}else{
                    continue
                }

            }

            return privateFilteredNews
        }

    }

    
    static getLikesFromNews=async function(info){
        
        const [results, fields]=await connection.query('SELECT COUNT(*) AS count FROM likes WHERE news_id=UUID_TO_BIN(?)',
            [info.query.id]
        )
        const [users]=await connection.query('SELECT BIN_TO_UUID(id) as like_id, user_id as id FROM likes WHERE news_id=UUID_TO_BIN(?)',
            [info.query.id]
        )

        let usersToPass=[]
        for(let user of users){
            
            let [newUser]=await connection.query(
                'SELECT username, image FROM news_user WHERE id=?',
                [user.id]
            )

            let userToPush={
                "username":newUser[0].username,
                "image":newUser[0].image,
                "likeId":user.like_id
            }
            usersToPass.push(userToPush)
        }
    
        const likesToShow={
            likes_count:results[0].count,
            users:usersToPass
        }

        return likesToShow
    }


   
    static getCommentsFromNews=async function(info){
        
        const [results, fields]=await connection.query('SELECT COUNT(*) AS count FROM comments WHERE news_id=UUID_TO_BIN(?)',
            [info.query.id]
        )
        const [users]=await connection.query('SELECT user_id as id FROM comments WHERE news_id=UUID_TO_BIN(?)',
            [info.query.id]
        )

        let usersToPass=[]
        let currentUser=[];

        for(let user of users){

            const [userIdToUUID]=await connection.query(
            'SELECT BIN_TO_UUID(?) as id',
            [user.id]
            )
          
            //estamos validando que, si ya hemos extraido los comentarios de un usuario, no vuelva a extrar sus comentarios 
            //y pase al siguiente
            //se enví aun objeto con: nombre de usuario, imagen de perfil, y un array con el contenido de los comentarios y sus id
            if(currentUser.includes(userIdToUUID[0].id)){
                 continue
            }
          
            currentUser.push(userIdToUUID[0].id)
            
            let [newUser]=await connection.query(
                'SELECT username,  image FROM news_user WHERE id=?',
                [user.id]
            )
            let [userComments]=await connection.query(
                'SELECT content, BIN_TO_UUID(id) as id FROM comments WHERE user_id=? AND news_id=UUID_TO_BIN(?)',
                [user.id, info.query.id]
            )

            let userToPush={
                "username":newUser[0].username,
                "image":newUser[0].image,
                "comments":userComments
            }
            usersToPass.push(userToPush)
        }
    
        const commentsToShow={
            comments_count:results[0].count,
            users:usersToPass
        }

        return commentsToShow
    }




    static getAllTags=async function(){
        
        const [results, fields]=await connection.query('SELECT name FROM tags ')

        return results
    }

    static getRequestsByUsername=async function(info){

        const username=info.validationInfo?.user

        try{

            const userLoggedId=await this.getIdFromName('news_user', username)
           
            const [groups]=await connection.query(
                'SELECT group_id as gi FROM user_groups WHERE user_id=UUID_TO_BIN(?) AND isAdmin=1',
                [userLoggedId]
            )

            let request=[]

            for(let g of groups){
              
                let [requests]=await connection.query(
                    'SELECT BIN_TO_UUID(id) as id, user_id as ui, content, creation_date as date FROM requests WHERE group_id=? ORDER BY creation_date DESC',
                    [g.gi]
                )

                let [groupName]=await connection.query(
                    'SELECT name from news_group WHERE id=?',
                    [g.gi]
            )

            
                for (let r of requests){
                    let [username]=await connection.query(
                    'SELECT username,  image from news_user WHERE id=?',
                    [r.ui]
                    )
          
                
                 let requestInfo={
                        id:r.id,
                        username:username[0].username,
                        groupName:groupName[0].name,
                        content:r.content,

                        image:username[0].image
                     }

                     request.push(requestInfo)
                  
                }

            }

            return request




        }catch(error){return {message:error.message}}
        
        
    }

    static getPendingRequestsByUsername=async function(info){

        const username=info.validationInfo?.user

        try{

            let userLoggedId=await this.getIdFromName('news_user', username)
   
                let [requests]=await connection.query(
                    'SELECT BIN_TO_UUID(id) as id, user_id as ui, group_id as gi, content, creation_date as date FROM requests WHERE user_id=UUID_TO_BIN(?) ORDER BY creation_date DESC',
                    [userLoggedId]
                )

                let request=[]
            
                for (let r of requests){

                    let [group]=await connection.query(
                        'SELECT name from news_group WHERE id=?',
                        [r.gi]
                    )
          
                
                 let requestInfo={
                        id:r.id,
                        username:username,
                        groupName:group[0].name,
                        content:r.content,
                     }

            request.push(requestInfo)
                
                

            }

            return request




        }catch(error){return {message:error.message}}
        
        
    }



    static makeRequest=async function(info){


        const username=info.validationInfo?.user
        const groupName=info.body.group
        const text=info.body.text

        try{
            const userLoggedId=await this.getIdFromName('news_user', username)
            const groupId=await this.getIdFromName('news_group', groupName)
            console.log(userLoggedId, groupId)
            const date=await this.getDate()

            const newRequestId=await this.getId()

            const [requests]=await connection.query(
                'SELECT user_id as ui, group_id as gi from requests WHERE user_id=UUID_TO_BIN(?) AND group_id=UUID_TO_BIN(?)',
                [userLoggedId, groupId]
            )

            if(requests[0]?.ui){return {message:'your request has already been made'}}


            const [result]=await connection.query(
                'INSERT INTO requests(id, user_id, group_id, creation_date, content) VALUES (?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)',
                [newRequestId, userLoggedId, groupId, date, text]
            )

            return {message:`your request from user ${username} for join ${groupName} has been made with id ${newRequestId}`}


        }catch(error){
            return {message:error.message}
        }

    }

    static deleteRequestById=async function(info){

        const username=info.validationInfo.user
        const requestId=info.body.id

        try{

            const userLoggedId=await this.getIdFromName('news_user', username)
            
            const [request]=await connection.query(
                'SELECT id, group_id as gi from requests WHERE id=UUID_TO_BIN(?)',
                [requestId]
            )

            const [isAdmin]=await connection.query(
                'SELECT isAdmin FROM user_groups WHERE group_id=? AND user_id=UUID_TO_BIN(?)',
                [request[0].gi, userLoggedId]
            )

            if(isAdmin[0].isAdmin==0){
                return {message:'you can`t make this action as you are not the admin of the group'}
            }else if(isAdmin[0].isAdmin==1){
                const [del]=await connection.query(
                    'DELETE FROM requests WHERE id=UUID_TO_BIN(?)',
                    [requestId]
                )

                return {message:`your request was deleted correctly: ${del}`}
            }



        }catch(error){
            return {message:error.message}
        }

    }

    static deleteCommentById=async function(info){

        const username=info.validationInfo?.user
        const commentId=info.body?.id

        try{

            const userLoggedId=await this.getIdFromName('news_user', username)
            
            const [comment]=await connection.query(
                'SELECT id, user_id as ui from comments WHERE id=UUID_TO_BIN(?) AND user_id=UUID_TO_BIN(?)',
                [commentId, userLoggedId]
            )

            if(!(comment[0].id && comment[0].ui)){
                return {message:'you can`t make this action as you are not the creator of the comment'}
            }else if((comment[0].id && comment[0].ui)){
                const [del]=await connection.query(
                    'DELETE FROM comments WHERE id=?',
                    [comment[0].id]
                )

                return {message:`your comment was deleted correctly: ${del}`}
            }



        }catch(error){
            return {message:error.message}
        }

    }
    static deleteLikeById=async function(info){

        const username=info.validationInfo?.user
        const likeId=info.body?.id

        try{

            const userLoggedId=await this.getIdFromName('news_user', username)
            
            const [like]=await connection.query(
                'SELECT id, user_id as ui from likes WHERE id=UUID_TO_BIN(?) AND user_id=UUID_TO_BIN(?)',
                [likeId, userLoggedId]
            )

            if(!(like[0].id && like[0].ui)){
                return {message:'you can`t make this action as you are not the creator of the like'}
            }else if((like[0].id && like[0].ui)){
                const [del]=await connection.query(
                    'DELETE FROM likes WHERE id=?',
                    [like[0].id]
                )

                return {message:`your like was deleted correctly: ${del}`}
            }



        }catch(error){
            return {message:error.message}
        }

    }
  
        static updateDescription=async function(info){

            const username=info.validationInfo?.user
            const newDescription=info.body?.description

            try{

                const userId=await this.getIdFromName('news_user',username)

                const [result]=await connection.query(
                    'UPDATE news_user SET description=? WHERE id=UUID_TO_BIN(?) ',
                    [newDescription, userId]
                )

                return {message:`Your description was updated:${result}`}
            }catch(error){
                return {message:`we could not update your description:${error}`}
            }
        }
}