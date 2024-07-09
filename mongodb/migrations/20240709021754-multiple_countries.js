module.exports = {
  async up(db, client) {
    await db.collection("users").updateMany(
      {
        country: { $exists: true },
      },
      [
        {
          $set: { country: ["$country"] },
        },
      ]
    );

    await db.collection("users").updateMany(
      {
        country: { $exists: false },
      },
      [
        {
          $set: { country: [] },
        },
      ]
    );
  },

  async down(db, client) {
    await db.collection("users").updateMany(
      {
        country: { $exists: true },
      },
      [
        {
          $set: { country: { $arrayElemAt: ["$country", -1] } },
        },
      ]
    );
  },
};
