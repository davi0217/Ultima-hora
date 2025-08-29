import express from 'express'
import {NewspaperModel} from '../models/newspaper.js'

export class NewspaperController{

    static getAll=async  function(req, res){

            const result=await NewspaperModel.getAll()
            console.log(result)
            res.send(result)
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

}