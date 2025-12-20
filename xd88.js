import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/api/sun", async (req, res) => {
  try {
    const response = await axios.get(
      "https://toolgametx.space/sun.php",
      {
        params: { _: Date.now() },
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://toolgametx.space/",
        },
        timeout: 10000,
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Proxy running on port", PORT)
);
