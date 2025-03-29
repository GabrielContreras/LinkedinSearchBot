import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import * as dotenv from "dotenv";

export interface JobItem {
    JobId: string,
    position: string,
    company: string,
    location: string,
    date: string,
    salary: string,
    jobUrl: string,
    companyLogo: string,
    agoTime: string,
    jobScore: string
}

dotenv.config();

const tableName = process.env.DYNAMODB_TABLE_NAME;
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

export async function putItem(jobItem: JobItem) {
  // 1 week TTL timestamp
  const ttlTimestamp = Math.floor( (new Date().getTime() + 7 * 24 * 60 * 60 * 1000) / 1000);
  const ddbItem = {
        JobId: { S: jobItem.JobId },
        position: { S: jobItem.position },
        company: { S: jobItem.company },
        location: { S: jobItem.location },
        date: { S: jobItem.date },
        salary: { S: jobItem.salary },
        jobUrl: { S: jobItem.jobUrl },
        companyLogo: { S: jobItem.companyLogo },
        agoTime: { S: jobItem.agoTime },
        jobScore: { N : jobItem.jobScore},
        reported: { N: "0"},
        ttl: { N: ttlTimestamp.toString() }
    };

    try {
        const command = new PutItemCommand({
            TableName: tableName,
            Item: ddbItem,
            ConditionExpression: "attribute_not_exists(JobId)"
        });
        await dynamoClient.send(command);
        console.log("Successfully put job posting to ddb.")
      } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {
            console.log("Item with jobId already exists. Skipping.");
        } else if (error.name === "ValidationException") {
            console.log("Validation has failed to add job posting.");
        } else {
            console.error("Error adding item:", error);
        }
      }
}

export async function processJobs() : Promise<JobItem[] | null>{
    const queryParams = {
        TableName: tableName,
        IndexName: process.env.DYNAMODB_INDEX_NAME,
        KeyConditionExpression: "reported = :reportedValue",
        ExpressionAttributeValues: {
          ":reportedValue": { N: "0" },
        },
        ScanIndexForward: false,
        Limit: 10
    };

    try {
        console.log("Attempting to process jobs");
        const queryCommand = new QueryCommand(queryParams);
        const queryResult = await dynamoClient.send(queryCommand);
        if (queryResult.Items) {
          let jobList : JobItem[] = []; 
          for (const item of queryResult.Items) {
            const jobId = item.JobId.S;
            if(jobId == null) continue;
            
            console.log(`${item.position.S} | ${item.company.S} | ${item.jobScore.N} | ${item.jobUrl.S}`);
            const JobItem: JobItem = {
              JobId: item.JobId.S ?? "",
              position: item.position.S ?? "",
              company: item.company.S  ?? "",
              location: item.location.S ?? "",
              date: item.date.S ?? "",
              salary: item.salary.S ?? "",
              jobUrl: item.jobUrl.S ?? "",
              companyLogo: item.companyLogo.S ?? "",
              agoTime: item.agoTime.S ?? "",
              jobScore: item.jobScore.N ?? "",
            }
            jobList.push(JobItem);

            const updateParams = {
              TableName: tableName,
              Key: {
                JobId: { S: jobId },
              },
              UpdateExpression: "SET reported = :newValue",
              ExpressionAttributeValues: {
                ":newValue": { N: "1" },
              },
            };
    
            const updateCommand = new UpdateItemCommand(updateParams);
            await dynamoClient.send(updateCommand);
    
            console.log(`Job ID: ${jobId} processed.`);
          }
          return jobList;
        } else {
          console.log("No unprocessed jobs found.");
          return null;
        }
    } catch (error) {
        console.error("Error processing jobs:", error);
        return null;
    }
}

export async function checkIdExists(id: string) {
  const params = {
      TableName: tableName,
      Key: {
          JobId: { S: id },
      },
      ProjectionExpression: 'JobId',
  };

  const command = new GetItemCommand(params);

  try {
      const result = await dynamoClient.send(command);
      return !!result.Item;
  } catch (error) {
      console.error('Error checking ID:', error);
      return false;
  }
}