import { REST, Routes } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from "dotenv";
dotenv.config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

// Load tất cả commands
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.log(`⚠️ Command ${file} thiếu "data" hoặc "execute"`);
  }
}

// Kiểm tra các biến môi trường cần thiết
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) {
  console.error('❌ DISCORD_TOKEN không được cung cấp!');
  console.log('💡 Hướng dẫn: Tạo file .env và thêm DISCORD_TOKEN=your_bot_token_here');
  process.exit(1);
}

if (!clientId) {
  console.error('❌ CLIENT_ID không được cung cấp!');
  console.log('💡 Hướng dẫn: Thêm CLIENT_ID=your_application_id vào file .env');
  process.exit(1);
}

if (!guildId) {
  console.error('❌ GUILD_ID không được cung cấp!');
  console.log('💡 Hướng dẫn: Thêm GUILD_ID=your_server_id vào file .env');
  console.log('💡 Hoặc bỏ qua GUILD_ID để deploy globally (sẽ mất 1 giờ để có hiệu lực)');
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// Deploy commands
(async () => {
  try {
    console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);
    console.log(`📡 Token: ${token.substring(0, 20)}...`);
    console.log(`🤖 Client ID: ${clientId}`);
    console.log(`🏠 Guild ID: ${guildId || 'Global deployment'}`);

    let data;
    
    if (guildId) {
      // Deploy to specific guild (immediate)
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
      console.log(`✅ Successfully deployed ${(data as any).length} commands to guild ${guildId}`);
    } else {
      // Deploy globally (takes up to 1 hour)
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log(`✅ Successfully deployed ${(data as any).length} commands globally (may take up to 1 hour)`);
    }
    
  } catch (error : any) {
    console.error('❌ Error deploying commands:', error);
    
    if (error.code === 0 && error.status === 401) {
      console.log('\n🔍 Khắc phục lỗi 401:');
      console.log('1. Kiểm tra DISCORD_TOKEN có đúng không');
      console.log('2. Kiểm tra CLIENT_ID có đúng không');
      console.log('3. Bot có được mời vào server chưa');
      console.log('4. Bot có quyền "applications.commands" không');
    }
  }
})();