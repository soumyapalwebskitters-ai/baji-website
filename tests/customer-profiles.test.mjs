import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/lib/customer-profiles.ts', import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
test('profiles persist, update by verified account ID and remain isolated from other accounts', async () => {
  const folder=mkdtempSync(join(tmpdir(),'baji-profiles-'));
  try {
    const schema=readFileSync(new URL('../migrations/reviews/0002_customer_profiles.sql',import.meta.url),'utf8');
    function query(sql,values=[]) {
      return JSON.parse(execFileSync('python3',['-c',`import sqlite3,json,sys
with sqlite3.connect(sys.argv[1]) as db:
 db.row_factory=sqlite3.Row
 db.executescript(sys.argv[2])
 rows=db.execute(sys.argv[3],json.loads(sys.argv[4])).fetchall()
 print(json.dumps([dict(row) for row in rows]))`,join(folder,'profiles.sqlite'),schema,sql,JSON.stringify(values)],{encoding:'utf8'}));
    }
    const db={prepare:sql=>({bind:(...values)=>({first:async()=>query(sql,values)[0]??null})})};
    const exports={};
    vm.runInNewContext(source,{exports,Error,process:{env:{NODE_ENV:'test'}},require:()=>({getCloudflareContext:async()=>({env:{REVIEWS_DB:db}})})});
    const first={name:"O'Brien",phone:'+919876543210',email:'customer@example.com',location:'Kolkata'};
    assert.deepEqual(await exports.saveCustomerProfile('verified-a',first),first);
    assert.deepEqual(await exports.loadCustomerProfile('verified-a'),first);
    assert.equal(await exports.loadCustomerProfile('different-account'),null);
    const changed={...first,name:'Updated name',email:'',location:'New city'};
    assert.deepEqual(await exports.saveCustomerProfile('verified-a',changed),changed);
    assert.equal(query('SELECT count(*) AS count FROM customer_profiles')[0].count,1);
    assert.deepEqual(await exports.loadCustomerProfile('verified-a'),changed);
  } finally {rmSync(folder,{recursive:true,force:true});}
});
