import { APIGatewayProxyEvent } from "aws-lambda";
import { parseUserId } from "../auth/utils";

export class AuthHelper {
  constructor() { }


  splitUserId(event: APIGatewayProxyEvent): string {
    const authorization = event.headers.Authorization;
    const split = authorization.split(' ');
    const token = split[1];
    return parseUserId(token);
  }

}