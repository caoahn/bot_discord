import { SlashCommandBuilder } from 'discord.js';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

export const data = new SlashCommandBuilder()
  .setName('todo')
  .setDescription('📋 Thêm một lời nhắc todo cá nhân.')
  .addIntegerOption(option =>
    option.setName('ngay')
      .setDescription('Ngày (1-31)')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('thang')
      .setDescription('Tháng (1-12)')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('nam')
      .setDescription('Năm (ví dụ: 2025)')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('gio')
      .setDescription('Giờ (0-23)')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('phut')
      .setDescription('Phút (0-59)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('noi_dung')
      .setDescription('Nội dung cần được nhắc')
      .setRequired(true)
  );

export async function execute(interaction: any) {
  const ngay = interaction.options.getInteger('ngay');
  const thang = interaction.options.getInteger('thang') - 1; // Lưu ý: tháng trong JS từ 0-11
  const nam = interaction.options.getInteger('nam');
  const gio = interaction.options.getInteger('gio');
  const phut = interaction.options.getInteger('phut');
  const noiDung = interaction.options.getString('noi_dung');
  const userId = interaction.user.id;
  const channelId = interaction.channelId;

  const parsedDate = new Date(nam, thang, ngay, gio, phut);

  if (isNaN(parsedDate.getTime())) {
    await interaction.reply({
      content: '❌ Thời gian không hợp lệ. Vui lòng kiểm tra lại các trường ngày/tháng/năm/giờ/phút.',
      ephemeral: true
    });
    return;
  }

  const filePath = path.join(__dirname, '..', '..', 'data', 'todo-list.xlsx');

  if (!fs.existsSync(filePath)) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, 'Todos');
    XLSX.writeFile(wb, filePath);
  }

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const newTask = {
    ThoiGian: parsedDate.toISOString(),
    NoiDung: noiDung,
    UserId: userId,
    ChannelId: channelId,
    DaNhac: false
  };

  data.push(newTask);

  const newSheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[workbook.SheetNames[0]] = newSheet;
  XLSX.writeFile(workbook, filePath);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const format = `${pad(ngay)}/${pad(thang + 1)}/${nam}-${pad(gio)}:${pad(phut)}`;

  await interaction.reply({
    content: `✅ Đã lưu lời nhắc cho **${format}**:\n> ${noiDung}`,
    ephemeral: true
  });
}
