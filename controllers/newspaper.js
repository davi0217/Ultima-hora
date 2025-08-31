import express from 'express'
import {NewspaperModel} from '../models/newspaper.js'

export class NewspaperController{

    static async validateToken(info, res){
        
        if(!info){
            await res.status(404).send({validate:false})
        }
    }

  

    static register=async  function(req, res){
       try { console.log(req.body)

            const result=await NewspaperModel.register(req.body)
            console.log(result)
            res.send(result)}catch(error){
                console.error(`we could not send your body ${error}`)
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
      static getAllGroups=async  function(req, res){

            const result=await NewspaperModel.getAllGroups()
            console.log(result)
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
}