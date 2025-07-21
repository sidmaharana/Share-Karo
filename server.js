require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const path = require("path");
const fileUpload = require("express-fileupload");

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, 
    abortOnLimit: true
}));

// Add this error handler
app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
            error: 'File too large. Maximum size is 10MB.' 
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
    .then(() => console.log("MongoDB Connected"))
    .catch(err => {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    });

const conn = mongoose.connection;

let gridFSBucket;
conn.once("open", async () => {
    gridFSBucket = new GridFSBucket(conn.db, { bucketName: "uploads" });
    console.log("GridFS Initialized");

   
    await conn.db.collection("uploads.files").createIndex(
        { "metadata.uploadDate": 1 },
        { expireAfterSeconds: 180 } 
    );

    console.log("⏳ TTL Index Set: Files will auto-delete after 3 minutes");
});


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


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
        res.json({ fileCode }); 
    });

    uploadStream.on("error", (err) => {
        res.status(500).json({ error: err.message });
    });
});


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


app.delete("/delete/:code", async (req, res) => {
    const fileCode = req.params.code;
    try {
       
        const file = await conn.db.collection("uploads.files").findOne({ filename: new RegExp(`^${fileCode}-`) });
        if (!file) return res.status(404).json({ error: "File not found" });

        const fileId = file._id;

       
        await gridFSBucket.delete(new ObjectId(fileId));

        
        await conn.db.collection("uploads.chunks").deleteMany({ files_id: fileId });

        res.json({ success: true, message: "File and related chunks deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
