import express from 'express'
import {NewspaperModel} from '../models/newspaper.js'

import {v2 as cloudinary} from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class NewspaperController{

    static async validateToken(info, res){
        
        if(!info){
            await res.status(404).send({validate:false})
        }
    }

  

    static register=async  function(req, res){
       try { console.log('Body:', req.body);
    console.log('File:', req.file ? req.file.originalname : null);

              let imageUrl = null;
              if (req.file) {
                const uploadResult = await new Promise((resolve, reject) => {
                  const stream = cloudinary.uploader.upload_stream(
                   
                    (error, result) => {
                      if (error) reject(error);
                      else resolve(result);
                    }
                  );
                  stream.end(req.file.buffer);
                });
                imageUrl = uploadResult.secure_url;
                console.log('imageUrl: '+imageUrl)
              }


            const result=await NewspaperModel.register(req, imageUrl)
            console.log(result)
            res.send(result)}catch(error){
                return {message:error.message}
            }
    }

    static login=async  function(req, res){
       try { 
            const result=await NewspaperModel.login(req.body)
           
            res.status(200).send(result)}catch(error){
                console.error(`we could not send your body ${error}`)
            }
    }

    static async createGroup(req, res){

        await NewspaperController.validateToken(req.validationInfo, res)
         
        try { 
            
            const result=await NewspaperModel.createGroup(req)
           
            res.status(200).send(result)}catch(error){
                console.error(`we could not send your body ${error}`)
            }
    }
    static async addToGroup(req, res){

        await NewspaperController.validateToken(req.validationInfo, res)
         
        try { 
            
            const result=await NewspaperModel.addToGroup(req)
            res.status(200).send(result)}catch(error){
                console.error(`we could not send your body ${error}`)
            }
    }

    static createHeader=async  function(req, res){

        await NewspaperController.validateToken(req.validationInfo, res)
       try { 
            const result=await NewspaperModel.createHeader(req)
           
            res.status(200).send(result)}catch(error){
                console.error(`we could not send your body ${error}`)
            }
    }
    
    static publishNews=async  function(req, res){

        await NewspaperController.validateToken(req.validationInfo, res)
       try { 
        let result;
            try{
                console.log('your user is' +req.validationInfo?.user)
                
                 result=await NewspaperModel.publishNews(req)}catch(error){
                console.log(`problems sending you body ${error.message}`)
            }
           
            res.status(200).send(result)}catch(error){
                console.error(`we could not send your body ${error}`)
            }
    }

       static likeNews=async  function(req, res){

      await NewspaperController.validateToken(req.validationInfo, res)
       try { 
            const result=await NewspaperModel.likeNews(req)
           
            res.status(200).send(result)}catch(error){
                console.error(`we could not send your body ${error}`)
            }
    }
       static leaveComment=async  function(req, res){

        await NewspaperController.validateToken(req.validationInfo, res)
       try { 
            const result=await NewspaperModel.leaveComment(req)
           
            res.status(200).send(result)}catch(error){
                console.error(`we could not send your body ${error}`)
            }
    }

      static getAllUsers=async  function(req, res){

            const result=await NewspaperModel.getAllUsers()
            console.log(result)
            res.send(result)
    }
      static getUserLogged=async  function(req, res){

            const result=await NewspaperModel.getUserLogged(req)
           
            res.send(result)
    }

      static getUserByName=async  function(req, res){

            const result=await NewspaperModel.getUserByName(req)
           
            res.send(result)
    }
      static getAllGroups=async  function(req, res){

            const result=await NewspaperModel.getAllGroups()
            console.log(result)
            res.send(result)
    }
      static getGroupFromUsername=async  function(req, res){

            const result=await NewspaperModel.getGroupFromUsername(req)
            
            res.send(result)
    }
      static getUserGroupsByGroup=async  function(req, res){

            const result=await NewspaperModel.getUserGroupsByGroup(req)
           
            res.send(result)
    }
      static getAllHeaders=async  function(req, res){

            const result=await NewspaperModel.getAllHeaders()
            console.log(result)
            res.send(result)
    }
      static getAllSections=async  function(req, res){

            const result=await NewspaperModel.getAllSections()
            let sectionsToShow=[]
            result.forEach((s)=>{
                sectionsToShow.push(s.name)
            })

            res.send(sectionsToShow)
    }
     
     
      static getNewsBySectionAndHeader=async  function(req, res){

            const result=await NewspaperModel.getNewsBySectionAndHeader(req)
            
            res.send(result)
    }
      static getMostLikedNews=async  function(req, res){

            const result=await NewspaperModel.getMostLikedNews(req)
            
            res.send(result)
    }
     

      static getLikesFromNews=async  function(req, res){

            const result=await NewspaperModel.getLikesFromNews(req)
            res.send(result)
    }
 

     static getCommentsFromNews=async  function(req, res){

            const result=await NewspaperModel.getCommentsFromNews(req)
            res.send(result)
    }
      static getAllTags=async  function(req, res){

            const result=await NewspaperModel.getAllTags()
            console.log(result)
            res.send(result)
    }
      static getRequestsByUsername=async  function(req, res){

            const result=await NewspaperModel.getRequestsByUsername(req)
            console.log(result)
            res.send(result)
    }
      static getPendingRequestsByUsername=async  function(req, res){

            const result=await NewspaperModel.getPendingRequestsByUsername(req)
            console.log(result)
            res.send(result)
    }
      static makeRequest=async  function(req, res){

            const result=await NewspaperModel.makeRequest(req)
            console.log(result)
            res.send(result)
    }
      static deleteRequestById=async  function(req, res){

            const result=await NewspaperModel.deleteRequestById(req)
            console.log(result)
            res.send(result)
    }
      static deleteCommentById=async  function(req, res){

            const result=await NewspaperModel.deleteCommentById(req)
            console.log(result)
            res.send(result)
    }
      static deleteLikeById=async  function(req, res){

            const result=await NewspaperModel.deleteLikeById(req)
            console.log(result)
            res.send(result)
    }
      static updateDescription=async  function(req, res){

            const result=await NewspaperModel.updateDescription(req)
            console.log(result)
            res.send(result)
    }
}