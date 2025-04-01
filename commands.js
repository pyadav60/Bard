require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('bard')
        .setDescription('Interact with Bard!')
        .addStringOption(option =>
            option.setName('input')
            .setDescription('Say something or provide a YouTube link')
            .setRequired(true)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('Commands registered!');
    } catch (error) {
        console.error(error);
    }
})();
