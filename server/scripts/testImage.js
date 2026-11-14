
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

const IMAGE_ID = "6af47558b02586c4542df6cd";

async function testImage() {
  try {
    const dns = require("node:dns");
    dns.setServers(["8.8.8.8", "1.1.1.1"]);

    await mongoose.connect(process.env.MONGODB_URI);

    const bucket = new GridFSBucket(
      mongoose.connection.db,
      { bucketName: "campuscareImages" }
    );

    const outputPath = path.join(__dirname, "gridfs-test-image.jpg");

    const downloadStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(IMAGE_ID)
    );

    const writeStream = fs.createWriteStream(outputPath);

    downloadStream.pipe(writeStream);

    writeStream.on("finish", async () => {
      console.log("Image retrieved successfully!");
      console.log("Saved at:", outputPath);
      await mongoose.disconnect();
    });

    downloadStream.on("error", async (error) => {
      console.error("Image retrieval failed:", error.message);
      await mongoose.disconnect();
    });
  } catch (error) {
    console.error(error.message);
    await mongoose.disconnect();
  }
}

testImage();
