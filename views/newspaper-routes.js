import express from 'express'

import { Router } from 'express'
import {NewspaperController} from '../controllers/newspaper.js'

export const NewspaperRouter=Router()

NewspaperRouter.get('/',NewspaperController.getAll)
NewspaperRouter.post('/register',NewspaperController.register)
NewspaperRouter.post('/login',NewspaperController.login)