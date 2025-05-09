require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
  entersState,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const play = require('play-dl');

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Command prefix
const PREFIX = 'bard, ';

// YouTube URL checker
const YT_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;

// On bot ready
client.once('ready', () => {
  console.log('✅ Bard is online and ready to vibe!');
});

// On message
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  if (!content.toLowerCase().startsWith(PREFIX)) return;

  const query = content.slice(PREFIX.length).trim();

  // Trim and check if valid YouTube URL
  if (!YT_URL_REGEX.test(query)) {
    return message.reply('❌ Please enter a valid YouTube URL.');
  }

  await message.reply('🎶 Valid YouTube link detected. Preparing to play...');

  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    return message.reply('❌ You need to be in a voice channel first!');
  }

  try {
    const streamInfo = await play.stream(query, { quality: 2 });
    const info = await play.video_basic_info(query);
    const title = info.video_details.title;

    const resource = createAudioResource(streamInfo.stream, {
      inputType: streamInfo.type,
      inlineVolume: true
    });
    resource.volume.setVolume(1.0);

    const player = createAudioPlayer();

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    // Wait for connection to be ready
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    connection.subscribe(player);
    player.play(resource);

    await entersState(player, AudioPlayerStatus.Playing, 30_000);

    message.channel.send(`▶️ Now playing: **${title}**`);

    // Handle end of track
    player.on(AudioPlayerStatus.Idle, () => {
      const conn = getVoiceConnection(voiceChannel.guild.id);
      if (conn) conn.destroy();
    });

    player.on('error', (err) => {
      console.error('❌ Audio player error:', err);
      message.channel.send('⚠️ Something went wrong during playback.');
      const conn = getVoiceConnection(voiceChannel.guild.id);
      if (conn) conn.destroy();
    });

  } catch (err) {
    console.error('❌ Error during playback:', err);
    message.reply('⚠️ Failed to play the track. Please try again.');
  }
});

// Login using token
client.login(process.env.DISCORD_TOKEN);
