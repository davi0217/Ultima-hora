import express from 'express'

import { Router } from 'express'
import {NewspaperController} from '../controllers/newspaper.js'

export const NewspaperRouter=Router()

NewspaperRouter.get('/',NewspaperController.getAll)
NewspaperRouter.post('/register',NewspaperController.register)
NewspaperRouter.post('/login',NewspaperController.login)
NewspaperRouter.post('/create-group',NewspaperController.createGroup)
NewspaperRouter.post('/create-header',NewspaperController.createHeader)
NewspaperRouter.post('/publish-news',NewspaperController.publishNews)