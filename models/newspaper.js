import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import mysql from 'mysql2/promise'
import {validateUser} from '../utils/validateUser.js'
import {validateNews} from '../utils/validateNews.js'
import { id } from 'zod/v4/locales'
import { _isoDateTime } from 'zod/v4/core'
import { group } from 'console'

const config={
    "host":"localhost",
    "port":3308,
    "user":"root",
    "password":'',
    "database":"newspaper"
}


const connection=await mysql.createConnection(config)


export class NewspaperModel{

    static createToken=async function(username){
    const privateKey='dav0217'
        
        
    
        jwt.sign(
            {user:username},privateKey, {algorithm: 'HS256',expiresIn:'1h', allowInsecureKeySizes:true}, function(err, token){
                    if(err){
                        console.log(`error trying to make token: ${err}`)
                    }else{
                        console.log(token)
                        return token
                    }

            }
        )
    }
    
    static getDate=function(){
        const date=new Date()
         const  actualDate=`${date.getFullYear()}-${date.getMonth()+1}-${date.getDay()+1}`
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
          
            let tagsToShow=[]
            for(let t of tags[0]){
               
                let tagToAdd=await connection.query(
                    'SELECT name FROM tags WHERE id=?',
                    [t.tagId]
                )
                 await tagsToShow.push(tagToAdd[0][0].name)
            }

            return tagsToShow
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

            return {binaryId:idToPass}

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

        if(logUser){
       try{const token=await this.createToken(username) } catch(error){
        console.log(`we couldnt create your token: ${error.message}`)
       }
    }

        return logUser?{"message":"login succesful"}:{"message":"failed to log in"}
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
            const userUUID=await this.getIdFromName("news_user",info.validationInfo.user)
           
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

    static addToGroup=async function(info){
        const {name, group}=info.body
        console.log(group)
        const groupId=await this.getIdFromName("news_group", group)
        console.log(`group id is: ${groupId}`)
        const userAddedId=await this.getIdFromName("news_user", name)
        console.log(`USERTOADD id is: ${userAddedId}`)
        const userLoggedInId=await this.getIdFromName("news_user", info.validationInfo.user)
       console.log(`user logges id is: ${userLoggedInId}`)
        const userGroupId=await this.getId()
        console.log(`iserGrou is: ${userGroupId}`)

        const [loggedUserIsAdmin]=await connection.query(
            'SELECT isAdmin FROM user_groups WHERE (group_id=UUID_TO_BIN(?) AND user_id=UUID_TO_BIN(?))',
            [groupId, userLoggedInId]
          
        )
        console.log(loggedUserIsAdmin)
        if(loggedUserIsAdmin[0]?.isAdmin==1){
        const addUser=await connection.query(
            'INSERT INTO user_groups (id, user_id, group_id, isAdmin ) VALUES (?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?)',
            [userGroupId, userAddedId, groupId, false]
        )

        return userGroupId}else{
            return `You're not the admin of this group`
        }
    }

    static createHeader=async function(info){

        const {name, isPublic, group}=info.body

        const groupUUID=await this.getIdFromName("news_group", group)
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



        const validation=await validateNews(info.body)


        if(validation.error){
            
            return (`your news format was wrong: ${validation.error}`)
        }
      try{  
        
        const {header, section}=info.body
       
        const userId=await this.getIdFromName("news_user", info.validationInfo.user)
     
        const headerId=await this.getIdFromName("headers", header)

        const [group]=await connection.query(
            'SELECT group_id as gi FROM headers WHERE id=UUID_TO_BIN(?)',
            [headerId]
        )

        console.log(group)
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
            [newsId, userId, headerId, sectionId, info.body.image, news_date, info.body.title, info.body.subtitle, info.body.content, info.body.caption]
        )

        try{
            const {tags}=info.body

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
        return newsIdBin[0]
    
    }catch(error){
            console.log(`could not insert your news: ${error.message}`)
        }    
    }


    static likeNews=async function(info){

        const {newsId}=info.body
        const likeId=await this.getId()

        const userId=await this.getIdFromName("news_user", info.validationInfo.user)

        try{
            const checkLike=await connection.query(
                'SELECT BIN_TO_UUID(user_id) as ui, BIN_TO_UUID(news_id) as ni FROM likes'
            )

            

            for(let like of checkLike[0]){

                    if(like.ui==userId && like.ni==newsId){
                        return `The user has already liked the news`
                    }
            }
           

            const createLike=await connection.query(
                'INSERT INTO likes(id, user_id, news_id) VALUES (?, UUID_TO_BIN(?), UUID_TO_BIN(?))',
                [likeId, userId, newsId]
            )
            return `liked was inserted with id: ${likeId}`
        }catch(error){
            return (`like could not be inserted: ${error.message}`)
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
            return `comment was inserted with id: ${commentId}`
        }catch(error){
            return (`like could not be inserted: ${error.message}`)
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
                image:r.image
            }

            infoToShow.push(userToPass)
        }
        return infoToShow
    }
    static getAllGroups=async function(){
        
        const [results, fields]=await connection.query('SELECT * FROM news_group')

        return results
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

        for(let r of results){
         

            const [group]=await connection.query(
                'SELECT name as gn FROM news_group where id=?',
                [r.group_id]
            )

            let headerToPass={
                "name":r.name,
                "group":group[0].gn,
                "public":r.public==0?false:true,
                "creation":r.date
            }

            infoToPass.push(headerToPass)

        }

        return infoToPass
    }
    static getAllSections=async function(){
        
        const [results, fields]=await connection.query('SELECT * FROM news_section')



        return results
    }
  


    static getNewsBySectionAndHeader=async function(info){

        
        const validates=info.validationInfo?.user
        
        let queryResult;
        
        if(info.query.section || info.query.header){
            
                if(!info.query.section || !info.query.header){
                    let queryToPass=info.query.section?info.query.section:info.query.header
                    
                    if(info.query.section){
                    queryResult=await connection.query(
                    'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.subtitle as subtitle,a.caption as caption,a.content as content,a.image as image,b.username as username, c.name as header, c.id as header_id,d.name as section from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id where d.name=?',
                     [queryToPass]
                        )}else{
                    queryResult=await connection.query(
                    'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.subtitle as subtitle,a.caption as caption,a.content as content,a.image as image,b.username as username, c.name as header,c.id as header_id,d.name as section from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id where c.name=?',
                     [queryToPass]
                        )}



                        
                }else{
                    
                            const {section, header}=info.query
                        queryResult=await connection.query(
                    'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.subtitle as subtitle,a.caption as caption,a.content as content,a.image as image,b.username as username, c.name as header,c.id as header_id,d.name as section from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id where d.name=? and c.name=?',
                    [section, header]
                        )}
    
        }else{
            queryResult=await connection.query(
                  'select BIN_TO_UUID(a.id) as news_id, a.title as title, a.subtitle as subtitle,a.caption as caption,a.content as content,a.image as image,b.username as username, c.name as header,c.id as header_id,d.name as section from news as a join news_user as b on a.user_id=b.id join headers as c on a.header_id=c.id join news_section as d on a.section_id=d.id',
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
        const [users]=await connection.query('SELECT user_id as id FROM likes WHERE news_id=UUID_TO_BIN(?)',
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
                "image":newUser[0].image
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
                'SELECT username, image FROM news_user WHERE id=?',
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

    

}