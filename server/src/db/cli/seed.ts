#!/usr/bin/env node
import { env } from '../../config/env.ts';
import { closeDatabase, getDatabase, resolveDatabasePath } from '../connection.ts';
import { isSeeded, migrate } from '../migrate.ts';
import { seed } from '../seed.ts';

const fresh = process.argv.includes('--fresh');
const db = getDatabase();
migrate(db); // ensure the tables exist before we inspect them

if (!fresh && isSeeded(db)) {
  console.log('• Database already contains users — nothing to do. Use `npm run db:reset` to rebuild.');
  closeDatabase();
  process.exit(0);
}

console.log(`Seeding ${env.SEED_USER_COUNT.toLocaleString()} users into ${resolveDatabasePath()} …`);

let lastPercent = -1;
const result = seed(db, {
  userCount: env.SEED_USER_COUNT,
  randomSeed: env.SEED_RANDOM_SEED,
  fresh,
  onProgress: (done, total) => {
    const percent = Math.floor((done / total) * 100);
    if (percent !== lastPercent && percent % 10 === 0) {
      lastPercent = percent;
      process.stdout.write(`  ${percent}%\n`);
    }
  },
});

console.log(
  `✔ Seeded ${result.users.toLocaleString()} users, ${result.hobbies} hobbies, ` +
    `${result.userHobbies.toLocaleString()} user↔hobby links in ${result.durationMs} ms`,
);
closeDatabase();
