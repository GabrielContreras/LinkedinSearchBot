# LinkedIn Search Discord Bot
Automate your LinkedIn job search with intelligent ranking. This application utilizes Google's Gemini to process job postings and prioritize results based on user-defined criteria. Top-ranked jobs are delivered via Discord notifications through a dedicated bot, providing a seamless and efficient job search experience."

**Table of Contents**<br>
[How It Works](#how-it-works)<br>
[Getting Started](#getting-started)<br>
[Examples](#examples)<br>

## How It Works

This repo include two AWS Lambdas to search for jobs and the process jobs and notify the user. Each lambda goes through the following process:

### Search Jobs Lambda
1. Use `linkedin-jobs-api` to find the first 100 jobs found with the given search parameters.
2. Use Google's Gemini to rank each job posting with a score between 0-100.
3. Create a record for each new job posting found and push it into a DynamoDB table.

### Process Jobs Lambda
1. Query DynamoDB table holding job information for the top 10 highest ranked jobs that have not been reported previously.
2. Send the information from the retrieved 10 jobs to a discord channel through a discord bot.

The job posting record will include two extra values:
* ttl: A time value 7 days past when it was stored within DynamoDB. This can be used to automatically purge any records that exceed this time.
* reported: A binary value that will keep track of what jobs have already been sent to discord. This allows only new jobs to be processed every run.

### Automating the process
AWS Eventbridge scheduler can be used to automate this process. This will create a cron job that will run the lambdas at set intervals. 
> **Warning**<br>
> AWS can acrue a cost if usage goes past free tier credits.

## Getting Started
### Download repository and build using npm
```
npm install
npx tsc
```
### Update .env file with personalized information

Example:
```
AWS_REGION=US-EAST-2
DYNAMODB_TABLE_NAME=JobPosts
DYNAMODB_INDEX_NAME=ReportedIndex
DISCORD_BOT_TOKEN=DISCORD_BOT_API_TOKEN
DISCORD_CHANNEL_ID=DISCORD_CHANNEL_ID
GEMINI_API_TOKEN=GEMINI_API_TOKEN
JOB_SEARCH_KEYWORK="Software Engineer"
LOCATION="United States"
REMOTE="remote"     
PERSONAL_DESCRIPTION="Primary language is typescript using nodejs. Backend developer position. 3 years of experience."
```

[Gemini API key](https://aistudio.google.com) <br>
[Discord Bot API key](https://discord.com/developers/docs/quick-start/getting-started)

### Go to the root dir and zip the project. Make sure there is no parent directory.
```
.
├── README.md
├── dist
├── node_modules
├── package-lock.json
├── package.json
├── src
└── tsconfig.json
```

### Host on AWS. This will require the following services
#### AWS Lambda
Two lambdas need to be created. SearchJobsLambda and ProcessJobsLambda.
1. SearchJobsLambda
    * Runtime: Node.js 22.x
    * Handler: dist/search_jobs_lambda.lambdaHandler
    * Architecture: x86_64
    * Timeout: 10 minutes
    * Permissions (Recommend setting permissions to only run on resources created for this automation):
        * DynamoDB GetItem
        * DynamoDB PutItem
        * DynamoDB UpdateItem

2. ProcessJobsLambda
    * Runtime: Node.js 22.x
    * Handler: dist/process_jobs_lambda.lambdaHandler
    * Architecture: x86_64
    * Timeout: 10 minutes
    * Permissions (Recommend setting permissions to only run on resources created for this automation):
        * DynamoDB GetItem
        * DynamoDB PutItem
        * DynamoDB UpdateItem

#### AWS DynamoDB
Need to create a table and a global secondary index. Global secondary index will allow the ProcessJobsLambda to query for high ranking jobs more efficiently.
1. DynamoDB Table
    * Whatever name you use, make sure it matches what is put in the .env file.
    * Partition Key: JobId
    * Sort Key: (Keep empty)
    * Time to Live (TTL): Set the attribute to ttl. This will purge job postings older than 1 week old.
    * Recommended: To stay within the free tier, set capacity to provisioned with 5 RCU/WCU with auto scaling turned off.
2. Global Secondary Index:
    * Whatever name you use, make sure it matches what is put in the .env file
    * Partition Key: reported (Number)
    * Sort Key: jobScore (Number);
    * Recommended: To stay within the free tier, set capacity to provisioned with 5 RCU/WCU with auto scaling turned off.

#### AWS EventBridge
To automate these jobs, we can use AWS EventBridge Scheduler to run the SearchJobsLambda and ProcessJobsLambda at set intervals. To avoid going past the free tier limit, I recommend the following settings for each lambda.

1. SearchJobsLambda
    * Run every 30 minutes
    * Cron: 0/30 * * * ? *

2. ProcessJobsLambda
    * Run every 1 hour. Set the bounds to what hours you'd like to receive the notifications for. Below example if for 9am-5pm. Set to 10 minutes past SearchJobsLambda run to get most recent jobs.
    * Cron: 10 9-18 * * ? *
#### AWS CloudWatch
AWS Lambda will automatically push logs to cloudwatch for each lambda execution. If any issues happen, you can view logs here.

## Examples
TODO
