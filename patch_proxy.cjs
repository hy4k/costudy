const fs = require('fs');
let content = fs.readFileSync('services/supabaseClient.ts', 'utf8');

const replacement = `
                const result = await value.apply(authTarget, args);
                if (result && result.error) {
                  const status = result.error.status || result.error.code;
                  const msg = result.error.message || '';
                  
                  // Do not fallback to mock for validation errors like Invalid Credentials or Email not confirmed
                  if (status == 400 || msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('email') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('already registered')) {
                     return result;
                  }

                  console.warn(\`Supabase auth error detected on "\${authProp as string}" (\${result.error.message || ''}), falling back to mock auth...\`);
                  return await handleMockAuthCall(authProp as string, args);
                }
`;

content = content.replace(/const result = await value\.apply\(authTarget, args\);\s*if \(result && result\.error\) \{\s*console\.warn\(\`Supabase auth error detected[^\`]*\`\);\s*return await handleMockAuthCall\(authProp as string, args\);\s*\}/, replacement.trim());

fs.writeFileSync('services/supabaseClient.ts', content, 'utf8');
console.log('patched');
