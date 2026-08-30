#!/usr/bin/env node
import { closeDatabase, getDatabase, resolveDatabasePath } from '../connection.ts';
import { migrate } from '../migrate.ts';

const db = getDatabase();
migrate(db);
console.log(`✔ Schema applied to ${resolveDatabasePath()}`);
closeDatabase();
