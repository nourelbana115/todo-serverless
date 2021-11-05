import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { TodosAccess } from '../../dataLayer/todosAccess'
import { AuthHelper } from '../../helpers/auth'
import { S3Helper } from '../../helpers/s3';
import { createLogger } from '../../utils/logger'

const todosAccess = new TodosAccess()
const authHelper = new AuthHelper()
const s3Helper = new S3Helper()
const logger = createLogger('todos')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todo_id = event.pathParameters.todoId
  const userId = authHelper.splitUserId(event)

  const item = await todosAccess.getTodoById(todo_id)
  if (item.Count == 0) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'No TODO with this id'
      })
    }
  }

  if (item.Items[0].userId !== userId) {
    logger.error(`you requesting put url Todo does not belong to his account with id ${todo_id}`)
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: 'You are not authorized'
      })
    }
  }

  const uploadUrl = s3Helper.getPresignedUrl(todo_id)
  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadUrl: uploadUrl
    })
  }
})

handler.use(
  cors({
    credentials: true
  })
)
