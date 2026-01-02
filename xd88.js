const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

const URL = "https://toolgametx.space/sun.php";

app.get("/api/sunwin", async (req, res) => {
  try {
    const response = await axios.get(URL, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      },
      timeout: 10000
    });

    // trả thẳng JSON gốc
    res.json(response.data);

  } catch (err) {
    console.error("Lỗi:", err.message);
    res.status(500).json({
      error: "Không gọi được sun.php",
      detail: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`OK → http://localhost:${PORT}/api/sunwin`);
});
