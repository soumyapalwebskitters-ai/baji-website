import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
test('product query table persists snapshots and safely deduplicates retries',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'baji-query-'));
 try{
  const schema=readFileSync(new URL('../migrations/reviews/0003_product_query.sql',import.meta.url),'utf8');
  const query=(sql,values=[])=>JSON.parse(execFileSync('python3',['-c',`import sqlite3,json,sys
with sqlite3.connect(sys.argv[1]) as db:
 db.row_factory=sqlite3.Row
 db.executescript(sys.argv[2])
 rows=db.execute(sys.argv[3],json.loads(sys.argv[4])).fetchall()
 print(json.dumps([dict(row) for row in rows]))`,join(directory,'queries.sqlite'),schema,sql,JSON.stringify(values)],{encoding:'utf8'}));
  const db={prepare:sql=>({bind:(...values)=>({first:async()=>query(sql,values)[0]??null})})};const exports={};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/lib/product-queries.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,process:{env:{NODE_ENV:'test'}},require:()=>({getCloudflareContext:async()=>({env:{REVIEWS_DB:db}})})});
  const contact={name:"O'Brien",phone:'+919876543210',email:'customer@example.com',location:'City'};const items=[{productId:'p1',quantity:2,totalMinor:5000}];
  assert.equal((await exports.saveProductQuery('query-id','hash',contact,items,5000)).id,'query-id');
  await exports.saveProductQuery('query-id','hash',contact,items,5000);
  const rows=query('SELECT * FROM "product query"');assert.equal(rows.length,1);assert.equal(rows[0].name,contact.name);assert.equal(rows[0].phone,contact.phone);assert.equal(rows[0].status,'new');assert.equal(rows[0].estimated_total_minor,5000);assert.deepEqual(JSON.parse(rows[0].items_json),items);
  assert.equal((await exports.findProductQuery('query-id')).request_hash,'hash');assert.equal(await exports.findProductQuery('missing'),null);
 }finally{rmSync(directory,{recursive:true,force:true})}
});
