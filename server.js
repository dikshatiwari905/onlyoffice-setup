const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const filesDir = path.join(__dirname, "public/files"); // original files
const saveDir = path.join(__dirname, "saved");

if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);

// Serve static frontend (editor.html etc.)
app.use(express.static(path.join(__dirname, "public")));

// Serve plugins
app.use("/plugins", express.static(path.join(__dirname, "plugins")));


/**
 * Get list of available .docx files in public/files
 */
app.get("/files", (req, res) => {
  const files = fs.readdirSync(filesDir).filter(f => f.endsWith(".docx"));
  res.json(files);
  console.log("Files list:", files);
});

/**
 * Fetch a file from public/files
 */
app.get("/file/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(filesDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader("Content-Disposition", `inline; filename=${filename}`);
  res.sendFile(filePath);
});

/**
 * Save callback from ONLYOFFICE
 */
app.post("/save", async (req, res) => {
   console.log("Raw callback::::>>>", JSON.stringify(req.body, null, 2));
  try {
    console.log("Callback received:", req.body);

    if ((req.body.status === 2 || req.body.status === 4 ) && req.body.url) {
      // Fix download URL for Docker environment
      let downloadUrl = req.body.url;

      // OnlyOffice cache URL often uses 'localhost', which won't work inside Docker
      downloadUrl = downloadUrl.replace("localhost", "host.docker.internal");

      // Clean and safe filename
      const filename = (req.body.key || "edited.docx").replace(/[^a-zA-Z0-9._-]/g, "");
      const filePath = path.join(saveDir, filename);

      console.log("➡ Downloading edited file from:", downloadUrl);

      // Fetch the file as arraybuffer
      const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });

      // Save locally
      fs.writeFileSync(filePath, response.data);

      console.log("Edited file saved successfully:", filePath);
    }

    // Always respond 200 to OnlyOffice
    res.json({ error: 0 });
  } catch (error) {
    console.error("Save error:", error.message);
    res.status(500).json({ error: 1, message: error.message });
  }
});

// app.post("/save", async (req, res) => {
//   try {
//     console.log("📥 Callback received:", req.body);

//     if (req.body.status === 2 && req.body.url) {
//       const downloadUrl = req.body.url;
//       const filename = (req.body.key || "edited.docx").replace(/[^a-zA-Z0-9._-]/g, "");
//       const filePath = path.join(saveDir, filename);

//       const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
//       fs.writeFileSync(filePath, response.data);

//       console.log("✅ Edited file saved:", filePath);
//     }

//     res.json({ error: 0 });
//   } catch (error) {
//     console.error("❌ Save error:", error.message);
//     res.status(500).json({ error: 1 });
//   }
// });

app.listen(PORT, "0.0.0.0", () => {
  console.log(`!!!!!Backend running at http://localhost:${PORT}`);
  console.log(`!!!!Open http://localhost:${PORT}/editor.html?file=example.docx`);
});



// const express = require("express");
// const fs = require("fs");
// const path = require("path");
// const axios = require("axios");
// const cors = require("cors");

// const app = express();
// const PORT = 3000;

// // Middleware
// app.use(cors()); // allow CORS for editor iframe
// app.use(express.json({ limit: "50mb" }));

// // Paths
// const publicDir = path.join(__dirname, "public");
// const saveDir = path.join(__dirname, "saved");

// if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);

// // Serve static files (editor.html + assets)
// app.use(express.static(publicDir));

// // Explicit route for document download
// app.get("/example.docx", (req, res) => {
//   const filePath = path.join(publicDir, "example.docx");
//   if (!fs.existsSync(filePath)) {
//     return res.status(404).send("File not found");
//   }
//   res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
//   res.setHeader("Content-Disposition", "inline; filename=example.docx");
//   res.sendFile(filePath);
// });

// // Save callback from ONLYOFFICE
// app.post("/save", async (req, res) => {
//   try {
//     console.log("📥 Callback received:", req.body);

//     // ONLYOFFICE status 2 = document ready to save
//     if (req.body.status === 2 && req.body.url) {
//       const downloadUrl = req.body.url;
//       const filePath = path.join(saveDir, "edited.docx");

//       const response = await axios.get(downloadUrl, { responseType: "arraybuffer" });
//       fs.writeFileSync(filePath, response.data);

//       console.log("✅ Edited file saved:", filePath);
//     }

//     res.json({ error: 0 }); // must always return {error:0}
//   } catch (error) {
//     console.error("❌ Save error:", error.message);
//     res.status(500).json({ error: 1 });
//   }
// });

// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 Backend running at http://localhost:${PORT}`);
//   console.log(`➡ Open http://localhost:${PORT}/editor.html`);
// });
