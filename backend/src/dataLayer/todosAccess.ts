import { TodoItem } from "../models/TodoItem";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
const uuid = require('uuid/v4')
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

export class TodosAccess {
    constructor(
        private readonly XAWS = AWSXRay.captureAWS(AWS),
        private readonly docClient: AWS.DynamoDB.DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODO_TABLE,
        private readonly userIdIndex = process.env.USER_ID_INDEX
    ) { }

    async getUserTodos(userId: string): Promise<TodoItem[]> {
        let result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.userIdIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()
        return result.Items as TodoItem[]
    }

    async createTodo(request: CreateTodoRequest, userId: string): Promise<TodoItem> {
        let newId = uuid()
        let item = new TodoItem()
        item.userId = userId
        item.todoId = newId
        item.createdAt = new Date().toISOString()
        item.name = request.name
        item.dueDate = request.dueDate
        item.done = false

        await this.docClient.put({
            TableName: this.todosTable,
            Item: item
        }).promise()
        return item
    }


    async getTodoById(id: string): Promise<AWS.DynamoDB.QueryOutput> {
        return await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'todoId = :todoId',
            ExpressionAttributeValues: {
                ':todoId': id
            }
        }).promise()
    }

    async updateTodo(updatedTodo: UpdateTodoRequest, id: string) {
        let { name, dueDate, done } = updatedTodo;
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                'todoId': id
            },
            UpdateExpression: 'set #namefield = :n, dueDate = :d, done = :done',
            ExpressionAttributeValues: {
                ':n': name,
                ':d': dueDate,
                ':done': done
            },
            ExpressionAttributeNames: {
                "#namefield": "name"
            }
        }).promise()
    }

    async deleteTodoById(id: string) {
        const param = {
            TableName: this.todosTable,
            Key: {
                "todoId": id
            }
        }

        await this.docClient.delete(param).promise()
    }
}