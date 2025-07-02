import * as XLSX from 'xlsx';
import * as path from 'path';
import dotenv from "dotenv";
dotenv.config();

export default function getRandomMonAn(): string {
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'mon-an-sang.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) return 'Không có món ăn sáng nào để gợi ý 😢';

    const randomItem = data[Math.floor(Math.random() * data.length)];
    return `🍽️ Gợi ý món ăn sáng hôm nay: **${randomItem.TenMon || 'Món ăn lạ'}**\n${randomItem.MoTa || ''}`;
  } catch (error) {
    console.error('Lỗi khi đọc file Excel:', error);
    return '❌ Không thể đọc dữ liệu món ăn sáng.';
  }
}