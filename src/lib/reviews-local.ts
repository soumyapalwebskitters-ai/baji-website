// Development fallback for machines that cannot run Cloudflare's workerd runtime.
// Production always uses the REVIEWS_DB D1 binding.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const execute = promisify(execFile);
const script = `import sqlite3,json,sys
payload=json.loads(sys.argv[2])
with sqlite3.connect(sys.argv[1], timeout=10) as db:
 db.row_factory=sqlite3.Row
 db.executescript(payload['schema'])
 rows=db.execute(payload['sql'],payload['values']).fetchall()
 print(json.dumps([dict(row) for row in rows]))
`;
export async function localReviewsDatabase() {
  const directory = path.join(process.cwd(), '.data');
  await mkdir(directory, { recursive: true });
  const schema = await readFile(path.join(process.cwd(), 'migrations/reviews/0001_reviews.sql'), 'utf8');
  async function query<T>(sql: string, values: unknown[] = []): Promise<T[]> {
    const { stdout } = await execute('python3', ['-c', script, path.join(directory, 'reviews.sqlite'), JSON.stringify({ schema, sql, values })], { maxBuffer: 1024 * 1024, timeout: 15000 });
    return JSON.parse(stdout);
  }
  return { prepare(sql: string) { return { all: async <T>() => ({ results: await query<T>(sql) }), bind: (...values: unknown[]) => ({ first: async <T>() => (await query<T>(sql, values))[0] || null }) }; } };
}
