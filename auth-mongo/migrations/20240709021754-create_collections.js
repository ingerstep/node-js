module.exports = {
  async up(db, client) {
    await db.createCollection('users');
    await db.createCollection('sessions');
    await db.createCollection('timers');
  },

  async down(db, client) {
    await db.collection('users').drop();
    await db.collection('sessions').drop();
    await db.collection('timers').drop();
  }
};
