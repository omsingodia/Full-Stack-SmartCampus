
const dns = require("node:dns");

// Use public DNS for MongoDB SRV lookup
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const { MongoClient } = require("mongodb");

async function testConnection() {
  try {
    // First test SRV DNS lookup
    const records = await dns.promises.resolveSrv(
      "_mongodb._tcp.cluster0.u2cz7j7.mongodb.net"
    );

    console.log("SRV DNS working!");
    console.log(records);

    // Then connect to MongoDB Atlas
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    try {
      await client.connect();

      console.log("MongoDB Atlas Connected Successfully!");

      const db = client.db("campuscare");
      console.log("Database:", db.databaseName);

      const result = await db.command({ ping: 1 });
      console.log("Ping Result:", result);
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error("Connection Failed:");
    console.error(error);
  }
}

testConnection();
