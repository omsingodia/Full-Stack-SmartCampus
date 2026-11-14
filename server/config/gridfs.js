
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let gridFSBucket;

const initializeGridFS = () => {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection is not ready");
  }

  gridFSBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "campuscareImages",
  });

  console.log("MongoDB GridFS initialized");
};

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error("GridFS is not initialized");
  }

  return gridFSBucket;
};

module.exports = {
  initializeGridFS,
  getGridFSBucket,
};
