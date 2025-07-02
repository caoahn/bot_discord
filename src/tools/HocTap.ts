import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { Client, TextChannel } from 'discord.js';
dotenv.config();

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())} - ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export default function checkTodos(client: Client) {
  const filePath = path.join(__dirname, '..', '..', 'data', 'todo-list.xlsx');
  if (!fs.existsSync(filePath)) return;

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = XLSX.utils.sheet_to_json(sheet);

  const now = new Date();
  let changed = false;

  for (const todo of data) {
    if (!todo.DaNhac && new Date(todo.ThoiGian) <= now) {
      const remindTime = formatDate(new Date(todo.ThoiGian));
      const userMention = `<@${todo.UserId}>`;

      const message = `🔔 **Lời nhắc từ TODO List!**\n\n` +
                      `👤 ${userMention}\n` +
                      `🕒 **Thời gian:** \`${remindTime}\`\n` +
                      `📌 **Nội dung:** ${todo.NoiDung}`;

      client.channels.fetch(todo.ChannelId)
        .then(channel => {
          if (channel?.isTextBased?.()) {
            (channel as TextChannel).send(message);
          }
        })
        .catch(err => console.error('❌ Không thể gửi nhắc nhở:', err));

      todo.DaNhac = true;
      changed = true;
    }
  }

  if (changed) {
    const newSheet = XLSX.utils.json_to_sheet(data);
    workbook.Sheets[workbook.SheetNames[0]] = newSheet;
    XLSX.writeFile(workbook, filePath);
  }
}
