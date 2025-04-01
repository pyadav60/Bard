require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { exec } = require('child_process');
const { createAudioPlayer, createAudioResource, AudioPlayerStatus, joinVoiceChannel } = require('@discordjs/voice');
const ytdl = require('ytdl-core'); // Keep ytdl-core for YouTube link handling
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once('ready', () => {
    console.log('Bard is ready!');
});

// Function to download YouTube audio using yt-dlp
function downloadYouTubeAudio(url) {
    return new Promise((resolve, reject) => {
        // Define where to save the file
        const outputDir = path.join(__dirname, 'downloads');
        const outputFile = path.join(outputDir, 'downloaded_audio.mp3');

        // Ensure the directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Run the yt-dlp command with specified output path
        const downloadCommand = `yt-dlp -f bestaudio --extract-audio --audio-format mp3 --quiet -o "${outputFile}" ${url}`;
        
        console.log(`Running command: ${downloadCommand}`);

        exec(downloadCommand, (error, stdout, stderr) => {
            if (error) {
                reject(`exec error: ${error}`);
                return;
            }
            if (stderr) {
                reject(`stderr: ${stderr}`);
                return;
            }

            // If the download succeeds, return the output file path
            resolve(outputFile);
        });
    });
}

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('bard,') || message.author.bot) return;

    const args = message.content.slice(5).trim(); // Get text after 'bard,'

    if (!args) {
        await message.reply('You need to say something or provide a link!');
        return;
    }

    if (args.startsWith('http')) {
        if (ytdl.validateURL(args)) {
            await message.reply('🎶 Joining voice channel...');

            const channel = message.member.voice.channel;
            if (!channel) {
                await message.reply('You need to join a voice channel first!');
                return;
            }

            try {
                // Download the audio from the YouTube link
                const audioFilePath = await downloadYouTubeAudio(args);
                console.log("Audio file path:", audioFilePath);

                // Check if the audio file exists
                fs.exists(audioFilePath, (exists) => {
                    if (!exists) {
                        console.error("Audio file does not exist!");
                        message.reply('There was an issue downloading the audio file.');
                        return;
                    }
                    console.log("Audio file exists, proceeding...");

                    // Join the voice channel
                    const connection = joinVoiceChannel({
                        channelId: channel.id,
                        guildId: message.guild.id,
                        adapterCreator: message.guild.voiceAdapterCreator
                    });

                    // Log for debugging
                    console.log('Attempting to join the voice channel...');
                    connection.on('error', (error) => {
                        console.error('Error while connecting to voice channel:', error);
                    });

                    // Create an audio resource from the downloaded file
                    const audioStream = fs.createReadStream(audioFilePath);
                    const resource = createAudioResource(audioStream);

                    // Create the audio player and play the resource
                    const player = createAudioPlayer();
                    connection.subscribe(player);
                    player.play(resource);

                    // When the audio is done, disconnect from the channel
                    player.on(AudioPlayerStatus.Idle, () => {
                        console.log("Audio player idle, disconnecting...");
                        setTimeout(() => {
                            connection.destroy();
                            console.log("Voice connection destroyed");
                        }, 2000); // Add a delay before disconnecting
                    });

                    message.reply(`🎶 Now playing: ${args}`);
                });
            } catch (err) {
                console.error('Error downloading or playing audio:', err);
                message.reply('There was an error with downloading the audio.');
            }
        } else {
            await message.reply(':C (I don\'t know that command!)');
        }
    } else {
        await message.reply(`:blush: (${args})`);
    }
});

client.login(process.env.DISCORD_TOKEN);
