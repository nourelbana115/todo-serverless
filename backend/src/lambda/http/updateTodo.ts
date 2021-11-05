import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { AuthHelper } from '../../helpers/auth'
import { TodosAccess } from '../../dataLayer/todosAccess'
import { createLogger } from '../../utils/logger'

const logger = createLogger('todos')
const todosAccess = new TodosAccess()
const authHelper = new AuthHelper()

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todo_id = event.pathParameters.todo_id
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  const userId = authHelper.splitUserId(event)

  const { Count, Items } = await todosAccess.getTodoById(todo_id)

  if (Count == 0)
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'No todo with this id'
      })
    }


  if (Items[0].userId !== userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'Not authorized'
      })
    }
  }

  logger.info(`User ${userId} updating Todo ${todo_id} to be ${updatedTodo}`)
  await new TodosAccess().updateTodo(updatedTodo, todo_id)
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
