require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const path = require("path");
const fileUpload = require("express-fileupload");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 },
    abortOnLimit: true
}));

// Middleware: File size error handler
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            error: 'File too large. Maximum size is 100MB.'
        });
    }
    next(err);
});

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.error("❌ MONGO_URI is not set in .env");
    process.exit(1);
}

mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    });

const conn = mongoose.connection;

let gridFSBucket;
conn.once("open", async () => {
    gridFSBucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    console.log("📦 GridFS Initialized");

    await conn.db.collection("uploads.files").createIndex(
        { "metadata.uploadDate": 1 },
        { expireAfterSeconds: 180 } // auto-delete in 3 mins
    );
    console.log("⏳ TTL Index Set: Files auto-delete after 3 minutes");
});

// Serve index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📁 File Upload Route
app.post("/upload", (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.files.file;
    const fileCode = Math.floor(100000 + Math.random() * 900000).toString();
    const fileName = `${fileCode}-${file.name}`;

    const uploadStream = gridFSBucket.openUploadStream(fileName, {
        metadata: { uploadDate: new Date() },
    });

    uploadStream.end(file.data);

    uploadStream.on("finish", () => {
        const directDownloadLink = `/direct-download/${fileCode}`;
        res.json({ fileCode, directDownloadLink });
    });

    uploadStream.on("error", (err) => {
        res.status(500).json({ error: err.message });
    });
});

// 📥 Download File by Code (for manual retrieval)
app.get("/download/:code", async (req, res) => {
    const fileCode = req.params.code;
    try {
        const files = await conn.db.collection("uploads.files").find({ filename: new RegExp(`^${fileCode}-`) }).toArray();
        if (!files.length) return res.status(404).json({ error: "File not found" });

        const file = files[0];
        const originalFileName = file.filename.replace(/^\d{6}-/, '');

        res.set("Content-Disposition", `attachment; filename="${originalFileName}"`);
        res.set("Content-Type", file.contentType || "application/octet-stream");
        gridFSBucket.openDownloadStream(file._id).pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ⬇️ Direct Download File by Code
app.get("/direct-download/:code", async (req, res) => {
    const fileCode = req.params.code;
    try {
        const files = await conn.db.collection("uploads.files").find({ filename: new RegExp(`^${fileCode}-`) }).toArray();
        if (!files.length) return res.status(404).json({ error: "File not found" });

        const file = files[0];
        const originalFileName = file.filename.replace(/^\d{6}-/, '');

        res.set("Content-Disposition", `attachment; filename="${originalFileName}"`);
        res.set("Content-Type", file.contentType || "application/octet-stream");
        gridFSBucket.openDownloadStream(file._id).pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🗑️ Delete File by Code
app.delete("/delete/:code", async (req, res) => {
    const fileCode = req.params.code;
    try {
        const file = await conn.db.collection("uploads.files").findOne({ filename: new RegExp(`^${fileCode}-`) });
        if (!file) return res.status(404).json({ error: "File not found" });

        const fileId = file._id;

        await gridFSBucket.delete(new ObjectId(fileId));
        await conn.db.collection("uploads.chunks").deleteMany({ files_id: fileId });

        res.json({ success: true, message: "File and chunks deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✍️ Share Text (store in MongoDB)
app.post("/share-text", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    let code = uuidv4().slice(0, 6); // Short unique code
    // Ensure code is always 6 characters long
    if (code.length !== 6) {
        console.warn("Generated UUID code was not 6 characters. Falling back to random number.");
        code = Math.floor(100000 + Math.random() * 900000).toString();
    }

    try {
        await conn.db.collection("texts").insertOne({
            code,
            text,
            createdAt: new Date()
        });

        // Optional: Auto-expire after 10 mins
        await conn.db.collection("texts").createIndex(
            { createdAt: 1 },
            { expireAfterSeconds: 600 }
        );

        console.log(`Generated text code: ${code}`); // Log the generated code

        res.json({ code });
    } catch (err) {
        console.error("Error sharing text:", err); // Log server-side errors
        res.status(500).json({ error: err.message });
    }
});

// 📄 Get Text by Code
app.get("/get-text/:code", async (req, res) => {
    const { code } = req.params;

    try {
        const doc = await conn.db.collection("texts").findOne({ code });
        if (!doc) return res.status(404).json({ error: "Code not found or expired" });

        res.json({ text: doc.text });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
