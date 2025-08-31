import express from 'express'

import { Router } from 'express'
import {NewspaperController} from '../controllers/newspaper.js'

export const NewspaperRouter=Router()

NewspaperRouter.get('/users',NewspaperController.getAllUsers)
NewspaperRouter.get('/groups',NewspaperController.getAllGroups)
NewspaperRouter.get('/usergroups/search',NewspaperController.getUserGroupsByGroup)
NewspaperRouter.get('/headers',NewspaperController.getAllHeaders)
NewspaperRouter.get('/sections',NewspaperController.getAllSections)

//aqui se pueden pasar parametros query section, header o ninguno, y devuelve todas las noticias
NewspaperRouter.get('/news/search',NewspaperController.getNewsBySectionAndHeader)
NewspaperRouter.get('/likes/search',NewspaperController.getLikesFromNews)
NewspaperRouter.get('/comments/search',NewspaperController.getCommentsFromNews)
NewspaperRouter.get('/tags',NewspaperController.getAllTags)
NewspaperRouter.post('/register',NewspaperController.register)
NewspaperRouter.post('/login',NewspaperController.login)
NewspaperRouter.post('/create-group',NewspaperController.createGroup)
NewspaperRouter.post('/add-to-group',NewspaperController.addToGroup)
NewspaperRouter.post('/create-header',NewspaperController.createHeader)
NewspaperRouter.post('/publish-news',NewspaperController.publishNews)
NewspaperRouter.post('/like-news',NewspaperController.likeNews)
NewspaperRouter.post('/leave-comment',NewspaperController.leaveComment)