import express from 'express'
import multer from 'multer'

import { Router } from 'express'
import {NewspaperController} from '../controllers/newspaper.js'


const upload=multer()


export const NewspaperRouter=Router()

NewspaperRouter.get('/users',NewspaperController.getAllUsers)
NewspaperRouter.get('/user',NewspaperController.getUserLogged)
NewspaperRouter.get('/user/search',NewspaperController.getUserByName)
NewspaperRouter.get('/groups',NewspaperController.getAllGroups)
NewspaperRouter.get('/groups/search',NewspaperController.getGroupFromUsername)
NewspaperRouter.get('/usergroups/search',NewspaperController.getUserGroupsByGroup)
NewspaperRouter.get('/headers',NewspaperController.getAllHeaders)
NewspaperRouter.get('/sections',NewspaperController.getAllSections)

//aqui se pueden pasar parametros query section, header o ninguno, y devuelve todas las noticias
NewspaperRouter.get('/news/search',NewspaperController.getNewsBySectionAndHeader)
NewspaperRouter.get('/news/most-liked',NewspaperController.getMostLikedNews)
NewspaperRouter.get('/likes/search',NewspaperController.getLikesFromNews)
NewspaperRouter.get('/comments/search',NewspaperController.getCommentsFromNews)
NewspaperRouter.get('/tags',NewspaperController.getAllTags)
NewspaperRouter.post('/register',upload.single('file'),NewspaperController.register)
NewspaperRouter.post('/login',NewspaperController.login)
NewspaperRouter.post('/create-group',NewspaperController.createGroup)
NewspaperRouter.post('/add-to-group',NewspaperController.addToGroup)
NewspaperRouter.post('/create-header',NewspaperController.createHeader)
NewspaperRouter.post('/publish-news',upload.single('file'),NewspaperController.publishNews)
NewspaperRouter.post('/like-news',NewspaperController.likeNews)
NewspaperRouter.post('/leave-comment',NewspaperController.leaveComment)
NewspaperRouter.post('/make-request',NewspaperController.makeRequest)
NewspaperRouter.get('/my-requests',NewspaperController.getRequestsByUsername)
NewspaperRouter.get('/pending-requests',NewspaperController.getPendingRequestsByUsername)
NewspaperRouter.delete('/request',NewspaperController.deleteRequestById)
NewspaperRouter.delete('/comment',NewspaperController.deleteCommentById)
NewspaperRouter.delete('/like',NewspaperController.deleteLikeById)
NewspaperRouter.put('/description',NewspaperController.updateDescription)