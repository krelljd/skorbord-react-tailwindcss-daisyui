import db from './db/database.js';

async function insertSqids() {
  await db.initialize();
  const sqids = [
    { id: 'demo', name: 'Demo Group' },
    { id: 'family', name: 'Family Night' },
    { id: 'tournament', name: 'Tournament 2025' }
  ];
  for (const sqid of sqids) {
    // Idempotent: only insert if not exists
    const exists = await db.get('SELECT id FROM sqids WHERE id = ?', [sqid.id]);
    if (!exists) {
      await db.run(
        'INSERT INTO sqids (id, name, created_at) VALUES (?, ?, ?)',
        [sqid.id, sqid.name, new Date().toISOString()]
      );
      console.log(`Inserted sqid: ${sqid.id}`);
    } else {
      console.log(`Sqid already exists: ${sqid.id}`);
    }
  }
  process.exit(0);
}

insertSqids().catch(err => {
  console.error('Error inserting sqids:', err);
  process.exit(1);
});
