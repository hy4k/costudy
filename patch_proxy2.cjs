const fs = require('fs');
let content = fs.readFileSync('services/supabaseClient.ts', 'utf8');

const replacement = `
              } catch (err: any) {
                const status = err.status || err.code;
                const msg = err.message || '';
                if (status == 400 || msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('email') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('already registered')) {
                   throw err;
                }
                console.warn(\`Supabase auth exception detected on "\${authProp as string}", falling back to mock auth...\`);
                return await handleMockAuthCall(authProp as string, args);
              }
`;

content = content.replace(/\} catch \(err: any\) \{\s*console\.warn\(\`Supabase auth exception detected on "[^"]*", falling back to mock auth\.\.\.\`\);\s*return await handleMockAuthCall\(authProp as string, args\);\s*\}/, replacement.trim());

fs.writeFileSync('services/supabaseClient.ts', content, 'utf8');
console.log('patched catch block');
