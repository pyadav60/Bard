require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

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

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bard') {
        const args = interaction.options.getString('input');

        if (!args) {
            await interaction.reply('You need to say something or provide a link!');
            return;
        }

        if (args.startsWith('http')) {
            await interaction.reply('🎶 Joining voice channel...');
            // Play audio (we'll add this next)
        } else {
            await interaction.reply(`(${args})`);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
