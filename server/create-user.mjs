// Password is read from stdin, never a command-line argument or log.
import {createApp} from './app.mjs';
import {randomBytes,scryptSync} from 'node:crypto';
const username=process.argv[2];
if(!username||!/^[a-zA-Z0-9_.-]{3,40}$/.test(username))throw Error('Usage: node server/create-user.mjs USERNAME < password-file');
let password='';for await(const chunk of process.stdin)password+=chunk;password=password.trimEnd();
if(password.length<12||password.length>128)throw Error('Password must be 12-128 characters.');
const {db}=createApp();const salt=randomBytes(24).toString('hex');
db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(randomBytes(24).toString('hex'),username,salt,scryptSync(password,salt,64));db.close();console.log('Account created.');
