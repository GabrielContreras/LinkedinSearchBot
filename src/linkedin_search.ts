import axios from 'axios';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';
import { run } from "./gemini";
import { checkIdExists, JobItem, putItem } from './ddb';
import * as dotenv from "dotenv";

dotenv.config();

interface QueryOptions {
    keyword: string;
    location: string;
    dateSincePosted: string;
    jobType: string;
    remoteFilter: string;
    salary: string;
    limit: string;
    sortBy: string;
    page: string;
  }

const queryOptions: QueryOptions = {
  keyword: process.env.JOB_SEARCH_KEYWORDS ?? "jobs",
  location: process.env.LOCATION ?? "United States",
  dateSincePosted: "24hr",
  jobType: "full time",
  remoteFilter: process.env.REMOTE ?? "remote",
  salary: "120000",
  limit: "10",
  sortBy: "relevant",
  page: "0",
};

interface Job {
    position: string;
    company: string;
    location: string;
    date: string;
    salary: string;
    jobUrl: string;
    companyLogo: string;
    agoTime: string;
};

async function processJob(job: Job) {
    const questionMarkIndex = job.jobUrl.indexOf('?');
    let url_id = job.jobUrl;
    if (questionMarkIndex !== -1) {
        url_id =  job.jobUrl.substring(0, questionMarkIndex);
    }

    const jobId = crypto.createHash('sha256').update(url_id).digest('hex'); // Generate unique ID

    try {

        if(await checkIdExists(jobId)!) {
            console.log("ID already exists. Skipping gemini");
            return;
        }
        let jobDescription = await extractJobDescription(job.jobUrl);
        let jobScore = 0;
        if(jobDescription == null) {
            jobDescription = "Description is not available";
        } else {
            let response = await run(jobDescription);
            if(response != null) {
                jobScore = response;
            }
        }

        const item: JobItem = {
            JobId: jobId,
            position: job.position,
            company: job.company,
            location: job.location,
            date: job.date,
            salary: job.salary,
            jobUrl: job.jobUrl,
            companyLogo: job.companyLogo,
            agoTime: job.agoTime,
            jobScore: jobScore.toString()
        }

        await putItem(item);
    } catch (error) {
        console.error("Error saving job to DynamoDB:", error);
    }
}

async function extractJobDescription(jobUrl: string): Promise<string | null> {
    try {
        const response = await axios.get(jobUrl);
        const html = response.data;
        const $ = cheerio.load(html);

        const jobDetails = $('.show-more-less-html__markup').text();
        return jobDetails.trim();
    } catch (error) {
        console.error(`Error fetching or parsing job description at ${jobUrl}:`);
        return null;
    }
}

export async function searchNewJobs() {
    const linkedIn: any = require("linkedin-jobs-api");
    await linkedIn.query(queryOptions).then(async (response: Job[]) => {
        for (const job of response) {
            console.log(`Job found: ${job.position} | Company: ${job.company} | Date: ${job.date}\n`);
            await processJob(job);
            await sleep(4000); // Wait for 4 second to avoid hitting gemini limit
        }
    });
}

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
