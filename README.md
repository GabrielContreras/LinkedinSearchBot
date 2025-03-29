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
TODO

## Examples
TODO
