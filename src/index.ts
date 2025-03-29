import { sendMessage } from "./discord_bot";
import { searchNewJobs } from "./linkedin_search";

async function main() {
    await searchNewJobs();
    await sendMessage();
}

main();
