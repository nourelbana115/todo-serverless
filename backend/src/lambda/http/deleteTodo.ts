import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { AuthHelper } from '../../helpers/auth'
import { TodosAccess } from '../../dataLayer/todosAccess'
import { createLogger } from '../../utils/logger'
const authHelper = new AuthHelper();
const logger = createLogger('todos')
const todosAccess = new TodosAccess()

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  if (!todoId) {
    logger.error('Invalid delete without Todo id !!!')
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'invalid or missing params'
      })
    }
  }

  const userId = authHelper.splitUserId(event)
  const item = await todosAccess.getTodoById(todoId)
  if (item.Count == 0) {
    logger.error(`you attemp to delete non existing Todo with id ${todoId}`)
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'No TODO with the provided id is found'
      })
    }
  }

  if (item.Items[0].userId !== userId) {
    logger.error(`you attemp to delete Todo that does not belong to his account with id ${todoId}`)
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'You are not authorized!'
      })
    }
  }

  logger.info(`User ${userId} deleting todo ${todoId}`)
  await todosAccess.deleteTodoById(todoId)
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'The request has succeeded.'
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)