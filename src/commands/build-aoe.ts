import { SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import * as XLSX from 'xlsx';
import * as path from 'path';

export const data = new SlashCommandBuilder()
  .setName('build-aoe')
  .setDescription('Xem thông tin quân trong AOE')
  .addStringOption(option =>
    option.setName('tenquan')
      .setDescription('Tên quân (ví dụ: Hitite)')
      .setRequired(true)
      .setAutocomplete(true)
  );

type QuanData = {
  DanhGia: string;
  TenQuan: string;
  GioiThieu: string;
  DiemManh: string;
  DiemYeu: string;
};

// Cache dữ liệu để tránh đọc file liên tục
let cachedData: QuanData[] | null = null;

function loadAOEData(): QuanData[] {
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'aoe.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    cachedData = XLSX.utils.sheet_to_json(sheet);
    return cachedData;
  } catch (error) {
    console.error('Lỗi khi đọc file AOE:', error);
    return [];
  }
}

// Hàm xử lý autocomplete
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const data = loadAOEData();
  
  if (!data.length) {
    await interaction.respond([]);
    return;
  }
  
  // Lọc các quân có tên chứa từ khóa người dùng nhập
  const filtered = data
    .filter((quan: QuanData) => 
      quan.TenQuan?.toLowerCase().includes(focusedValue)
    )
    .slice(0, 25)
    .map((quan: QuanData) => ({
      name: quan.TenQuan,
      value: quan.TenQuan
    }));
  
  // Nếu không có kết quả phù hợp, hiển thị tất cả (tối đa 25)
  if (filtered.length === 0 && focusedValue.length === 0) {
    const allOptions = data
      .slice(0, 25)
      .map((quan: QuanData) => ({
        name: quan.TenQuan,
        value: quan.TenQuan
      }));
    
    await interaction.respond(allOptions);
    return;
  }
  
  await interaction.respond(filtered);
}

// Hàm xử lý command chính
export async function execute(interaction: any) {
  const tenQuanInput = interaction.options.getString('tenquan')?.trim();
  const data = loadAOEData();
  
  if (!data.length) {
    await interaction.reply('❌ Không thể đọc dữ liệu AOE. Vui lòng thử lại sau.');
    return;
  }
  
  // Tìm quân chính xác trước
  let quan = data.find((row: QuanData) =>
    row.TenQuan?.toLowerCase() === tenQuanInput?.toLowerCase()
  );
  
  // Nếu không tìm thấy chính xác, tìm theo contains
  if (!quan) {
    quan = data.find((row: QuanData) =>
      row.TenQuan?.toLowerCase().includes(tenQuanInput?.toLowerCase())
    );
  }
  
  if (!quan) {
    // Gợi ý các quân tương tự
    const suggestions = data
      .filter((row: QuanData) => 
        row.TenQuan?.toLowerCase().includes(tenQuanInput?.toLowerCase().charAt(0))
      )
      .slice(0, 5)
      .map(q => q.TenQuan)
      .join(', ');
    
    const errorMessage = suggestions 
      ? `❌ Không tìm thấy quân **${tenQuanInput}**.\n💡 Có thể bạn muốn tìm: ${suggestions}`
      : `❌ Không tìm thấy quân **${tenQuanInput}**.`;
    
    await interaction.reply(errorMessage);
    return;
  }
  
  // Tạo embed với thông tin quân
  const embed = {
    title: `🏰 ${quan.TenQuan.trim()}`,
    color: 0x00AE86, // Màu xanh lá
    fields: [
      {
        name: '📖 Giới thiệu',
        value: quan.GioiThieu || 'Không có thông tin',
        inline: false
      },
      {
        name: '✅ Điểm mạnh',
        value: quan.DiemManh || 'Không có thông tin',
        inline: true
      },
      {
        name: '⚠️ Điểm yếu',
        value: quan.DiemYeu || 'Không có thông tin',
        inline: true
      },
       {
        name: '📝 Tổng kết',
        value: quan.DanhGia || 'Không có đánh giá tổng quan',
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Cakhongbietboi - Bot'
    }
  };
  
  await interaction.reply({
    embeds: [embed],
    ephemeral: false
  });
}
