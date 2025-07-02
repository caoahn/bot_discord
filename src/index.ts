import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { scheduleDailyReminder } from './utils/scheduler';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from "dotenv";
dotenv.config();

// Extend the Client interface to include the commands property
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}

// Tạo client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Collection để lưu commands
client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.log(`⚠️ Command ${file} thiếu "data" hoặc "execute"`);
  }
}

// Event: Bot ready
client.once(Events.ClientReady, (readyClient) => {
  console.log(`🚀 Bot đã sẵn sàng! Đăng nhập với tên: ${readyClient.user.tag}`);
  // Schedule daily reminder
  scheduleDailyReminder(client);
});

// Event: Xử lý slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  // Xử lý autocomplete
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
      console.error(`❌ Không tìm thấy command: ${interaction.commandName}`);
      return;
    }
    
    if (!command.autocomplete) {
      console.error(`❌ Command ${interaction.commandName} không có autocomplete function`);
      return;
    }
    
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(`❌ Lỗi autocomplete cho command ${interaction.commandName}:`, error);
    }
    return;
  }
  
  // Xử lý slash command thông thường
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    
    if (!command) {
      console.error(`❌ Không tìm thấy command: ${interaction.commandName}`);
      await interaction.reply({
        content: '❌ Command không tồn tại!',
        ephemeral: true
      });
      return;
    }
    
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Lỗi khi thực hiện command ${interaction.commandName}:`, error);
      
      const errorMessage = '❌ Có lỗi xảy ra khi thực hiện command!';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: errorMessage,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true
        });
      }
    }
  }
});

// Error handling
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Login bot
client.login(process.env.DISCORD_TOKEN);

// Export client để sử dụng ở nơi khác nếu cần
export default client;
