// ===================== MAX AI XOCDIA - FULL POWER EDITION =====================
// TỰ LẤY API → GỌI D-PREDICT (LÀM DỰ ĐOÁN CHÍNH) → LƯU HIS
// ============================================================================

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// API Lịch sử Tài Xỉu (Lucky Dice)
const API_URL_LUCKYDICE =
  "https://taixiu.system32-cloudfare-356783752985678522.monster/api/luckydice/GetSoiCau";

// API ngoài bạn muốn sử dụng làm dự đoán chính
const API_URL_DPREDICT = "https://d-predict.onrender.com/api/taixiu";

const HIS_FILE = path.join(__dirname, "history.json");
const MAX_HIS_LENGTH = 5000; // Giới hạn lưu lịch sử tối đa

// ID của bạn
const MY_ID = "tiendat09868";

// =================================================================================
// Tạm thời bỏ qua logic Cầu (RAW_CAU_TXT, loadCau, CAU_LIST, matchCau)
// =================================================================================


// =================================================================================
// FETCH API LỊCH SỬ
// =================================================================================
async function fetchData(limit = 50) {
  try {
    const res = await axios.get(API_URL_LUCKYDICE);
    const data = Array.isArray(res.data) ? res.data.slice(0, limit) : [];
    return data.map(e => ({
      phien: Number(e.SessionId),
      x1: Number(e.FirstDice),
      x2: Number(e.SecondDice),
      x3: Number(e.ThirdDice),
      tong: Number(e.DiceSum),
      kq: e.BetSide === 0 ? "TÀI" : "XỈU",
    }));
  } catch (err) {
    console.error("Lỗi khi fetch API lịch sử:", err.message);
    return [];
  }
}

// =================================================================================
// GỌI API D-PREDICT VÀ LẤY DỰ ĐOÁN
// =================================================================================
async function fetchDPredict(lastResult) {
    if (!lastResult) return { Du_doan: "Không xác định" };

    try {
        const payload = {
            "id": MY_ID,
            "Phien": lastResult.phien,
            "Xuc_xac_1": lastResult.x1,
            "Xuc_xac_2": lastResult.x2,
            "Xuc_xac_3": lastResult.x3,
            "Tong": lastResult.tong,
            "Ket_qua": lastResult.kq === "TÀI" ? "Tài" : "Xỉu", // Chuyển về định dạng API ngoài
        };

        const res = await axios.post(API_URL_DPREDICT, payload);
        
        // Lấy dữ liệu trả về và loại bỏ Pattern nếu có
        const data = res.data;
        delete data.Pattern; // Bỏ trường Pattern theo yêu cầu
        
        return {
             ...data,
             Du_doan: data.Du_doan.toUpperCase() === "TÀI" ? "TÀI" : "XỈU"
        };
    } catch (err) {
        console.warn("Cảnh báo: Lỗi khi gọi API d-predict:", err.message);
        return { Du_doan: "Lỗi API ngoài" };
    }
}


// =================================================================================
// LƯU HIS
// =================================================================================
async function saveHistory(arr) {
  await fs.writeJson(HIS_FILE, arr, { spaces: 2 });
}

async function loadHistory() {
  try {
    const his = await fs.readJson(HIS_FILE);
    return Array.isArray(his) ? his : [];
  } catch {
    return [];
  }
}

// =================================================================================
// API CHÍNH /xocdia88
// =================================================================================
app.get("/xocdia88", async (req, res) => {
  const apiData = await fetchData();
  if (!apiData.length) return res.json({ error: "Không lấy được dữ liệu API" });

  let his = await loadHistory();

  // 1. Cập nhật lịch sử
  const newPhien = apiData[0].phien;
  const lastPhienInHis = his.length > 0 ? his[0].phien : 0;
  let currentResult = apiData[0]; // Mặc định là kết quả mới nhất từ API

  // Chỉ thêm vào nếu phiên mới hơn phiên đã lưu gần nhất
  if (newPhien > lastPhienInHis) {
    const newItem = {
      phien: newPhien,
      xuc_xac_1: apiData[0].x1,
      xuc_xac_2: apiData[0].x2,
      xuc_xac_3: apiData[0].x3,
      tong: apiData[0].tong,
      ket_qua: apiData[0].kq,
    };
    his.unshift(newItem);
    currentResult = newItem;
  } else if (his.length === 0 && apiData.length > 0) {
     // Nếu lịch sử rỗng, thêm phiên hiện tại vào
     const newItem = {
      phien: newPhien,
      xuc_xac_1: apiData[0].x1,
      xuc_xac_2: apiData[0].x2,
      xuc_xac_3: apiData[0].x3,
      tong: apiData[0].tong,
      ket_qua: apiData[0].kq,
    };
    his.unshift(newItem);
    currentResult = newItem;
  } else if (his.length > 0) {
     // Nếu lịch sử không rỗng và phiên không mới hơn, lấy kết quả gần nhất trong lịch sử
     currentResult = his[0];
  }


  // Giới hạn số lượng lịch sử lưu trữ
  if (his.length > MAX_HIS_LENGTH) his = his.slice(0, MAX_HIS_LENGTH);
  await saveHistory(his);
  
  // 2. Lấy dự đoán từ D-Predict, gửi kết quả phiên gần nhất
  const dPredictData = await fetchDPredict(currentResult);
  
  // 3. Chuẩn bị kết quả trả về
  const predictResult = dPredictData.Du_doan;
  const nextPhien = currentResult.phien + 1;

  // 4. Trả về kết quả
  res.json({
    id: MY_ID,
    Phien: currentResult.phien,
    Xuc_xac_1: currentResult.xuc_xac_1,
    Xuc_xac_2: currentResult.xuc_xac_2,
    Xuc_xac_3: currentResult.xuc_xac_3,
    Tong: currentResult.tong,
    Ket_qua: currentResult.ket_qua,
    Phien_Hien_Tai: nextPhien, // Thêm trường Phiên hiện tại = Phiên gần nhất + 1
    Du_doan: predictResult,
  });
});

// =================================================================================
// API /his – xem toàn bộ lịch sử
// =================================================================================
app.get("/his", async (req, res) => {
  try {
    const his = await loadHistory();
    res.json({
      total: his.length,
      limit: MAX_HIS_LENGTH,
      data: his,
    });
  } catch {
    res.json({ total: 0, limit: MAX_HIS_LENGTH, data: [] });
  }
});

// =================================================================================
app.listen(PORT, () => {
  console.log("🔥 MAX AI XocDia đang chạy trên PORT", PORT);
});
