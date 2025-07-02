import cron from 'node-cron';
import { Client, TextChannel } from 'discord.js';
import dotenv from "dotenv";
import getRandomMonAn from '../tools/AnSang';
import checkTodos from '../tools/HocTap';
dotenv.config();

const channelId = process.env.REMINDER_CHANNEL_ID;

export function scheduleDailyReminder(client: Client) {
  cron.schedule('30 7 * * *', async () => {
    try {
      if (!channelId) {
        console.error('❌ GUILD_ID (channelId) không được định nghĩa trong biến môi trường.');
        return;
      }
      const channel = await client.channels.fetch(channelId) as TextChannel;

      if (!channel) {
        console.error(`❌ Không tìm thấy kênh với ID ${channelId}`);
        return;
      }
      const content = getRandomMonAn();
      await channel.send(content);
      console.log('✅ Đã gửi lời nhắc món ăn sáng.');
    } catch (error) {
      console.error('❌ Lỗi khi gửi lời nhắc:', error);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

    cron.schedule('* * * * *', () => {
      try {
        checkTodos(client);
      } catch (err) {
        console.error('❌ Lỗi khi kiểm tra todo:', err);
      }
    });
}
