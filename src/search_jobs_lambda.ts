import {  Context, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { searchNewJobs } from './linkedin_search';

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        await searchNewJobs();
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Success',
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};