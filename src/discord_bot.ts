const { Client, Events, GatewayIntentBits } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
import { TextChannel, Client as DiscordClient } from "discord.js";
import * as dotenv from "dotenv";
import { JobItem, processJobs } from "./ddb";
dotenv.config();


export async function sendMessage(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const discordClient = new Client({ intents: [GatewayIntentBits.Guilds] });

        discordClient.once(Events.ClientReady, async (readyClient: DiscordClient) => {
            if (readyClient.user) {
                console.log(`Ready! Logged in as ${readyClient.user.tag}`);
            } else {
                console.log("Ready! User information unavailable.");
            }
            console.log("New jobs searched. Sending message on discord next");

            try {
                const channel = await readyClient.channels.fetch(process.env.DISCORD_CHANNEL_ID!) as TextChannel;
                const jobList: JobItem[] = await processJobs() ?? [];
                if(jobList.length == 0) {
                    console.log("No new jobs to report");
                    readyClient.destroy();
                    return;
                }
                const embed = buildEmbed(jobList);
                console.log(embed);
                channel.send({ embeds: [embed] });
                readyClient.destroy();
            } catch (error) {
                console.error("Error sending message:", error);
            }
        });

        discordClient.login(process.env.DISCORD_BOT_TOKEN);
        console.log("Logged in successfully");
    });
}

function buildEmbed(jobList: JobItem[]) {
    const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle("New Ranked Jobs");

    for(const jobItem of jobList) {
        embed.addFields({name: jobItem.position, value: `${jobItem.company} | ${jobItem.jobScore}\n [Link](${jobItem.jobUrl})`})
    }

    return embed;
}
