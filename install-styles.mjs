import fs from 'node:fs';
import path from 'node:path';
const p=path.join(process.cwd(),'src','client','styles.css');
if(!fs.existsSync(p)) throw new Error('src/client/styles.css پیدا نشد');
let s=fs.readFileSync(p,'utf8');
const extra=fs.readFileSync(path.join(process.cwd(),'src','client','styles-passwordless.css'),'utf8');
if(!s.includes('.employee-login-page{')) fs.writeFileSync(p,s+'\n'+extra);
console.log('Passwordless styles installed.');
