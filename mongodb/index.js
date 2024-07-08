require("dotenv").config();

const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.DB_URI);

(async () => {
  try {
    await client.connect();

    const db = client.db("users");

    const res = await db.collection("users").find({
        age: {$gt: 16}
    }).toArray();

    console.log(res);
  } catch (error) {
    console.log(error);
  }

  await client.close();
})();
