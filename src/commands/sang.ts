import { SlashCommandBuilder } from 'discord.js';
import * as XLSX from 'xlsx';
import * as path from 'path';

export const data = new SlashCommandBuilder()
  .setName('breakfast')
  .setDescription('Gợi ý món ăn sáng ngẫu nhiên');

export async function execute(interaction: any) {
  const filePath = path.join(__dirname, '..', '..', 'data', 'mon-an-sang.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<{ TenMon: string }>(sheet);

  if (data.length === 0) {
    await interaction.reply('Không có món ăn nào trong file!');
    return;
  }

  const random = Math.floor(Math.random() * data.length);
  const monAn = data[random].TenMon;

  await interaction.reply(`👉 Hôm nay bạn nên ăn sáng với: **${monAn}** 🍽️`);
}
