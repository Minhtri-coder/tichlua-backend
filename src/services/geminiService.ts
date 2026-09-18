import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const transactionSchema = {
  type: "OBJECT",
  properties: {
    isVaild:{
        type:"BOOLEAN",
         description: "true nếu câu nói có chứa thông tin thu/chi tiền; false nếu là câu chào hỏi hoặc không liên quan tài chính"
    },
    amount: {
      type: "NUMBER",
      description: "Số tiền của giao dịch",
    },
    category: {
      type: "STRING",
      description:
        "Danh mục chi tiêu, ví dụ: Ăn uống, Di chuyển, Mua sắm, Thu nhập, etc.",
    },
    note: {
      type: "STRING",
      description: "Ghi chú ngắn gọn về giao dịch (Tùy chọn)",
    },
    type: {
      type: "STRING",
      format: "enum",
      enum: ["expense", "income"],
      description:
        'Loại giao dịch: "expense" (chi tiêu) hoặc "income" (thu nhập)',
    },
  },
  required: ["amount", "category", "note", "type"],
};

//3  Khởi tạo model Gemini Flash với cấu hình ép JSON

export interface ParsedTransaction {
  amount: number;
  category: string;
  note: string;
  type: "expense" | "income";
}

export const parseTransaction = async (
  userInput: string,
): Promise<ParsedTransaction> => {
  try {
    const reponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userInput,
      config: {
        systemInstruction: `
                Bạn là trợ lý tài chính thông minh cho ứng dụng Tích Lúa.
Nhiệm vụ: Phân tích câu nói tiếng Việt của người dùng về thu chi và chuyển thành dữ liệu.
Quy đổi tiếng lóng tiền tệ:
- k, nghìn, ngàn: x1.000 (vd: 50k -> 50000)
- củ, triệu, tr: x1.000.000 (vd: 2 củ -> 2000000, 1tr5 -> 1500000)
- lít: x100.000
- type: 'expense' (chi tiêu) hoặc 'income' (thu nhập).`,
        responseMimeType: "application/json",
        responseSchema:transactionSchema,
        temperature: 0.1,
      },
    });

    const reponseText = reponse.text;
    if (!reponseText) {
      throw new Error("Không nhận được phản hồi từ AI");
    }
    const parsedData = JSON.parse(reponseText);
    return parsedData;
  } catch (error: any) {
    console.error("Lỗi khi phân tích giao dịch:", error.message || error);
    throw new Error("Không thể phân tích nội dung giao dịch");
  }
};
