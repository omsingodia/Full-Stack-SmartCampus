
require("dotenv").config();

const connectDB = require("../config/db");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

const checkGridFS = async () => {
  try {
    await connectDB();

    const bucket = new GridFSBucket(
      mongoose.connection.db,
      { bucketName: "campuscareImages" }
    );

    const files = await bucket.find({}).toArray();

    console.log("\nTotal images:", files.length);

    files.forEach((file, index) => {
      console.log(`\nImage ${index + 1}`);
      console.log("ID:", file._id);
      console.log("Name:", file.filename);
      console.log("Type:", file.metadata?.contentType);
      console.log("Size:", file.length, "bytes");
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("GridFS check failed:", error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
  }
};

checkGridFS();
