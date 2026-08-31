const fs = require('fs');
let content = fs.readFileSync('services/supabaseClient.ts', 'utf8');

const replacement = `
    get(target, prop, receiver) {
      if (prop === 'then') {
        return async function(onfulfilled: any, onrejected: any) {
          try {
            // SHORT CIRCUIT for mock users:
            // If the query contains a mock ID ('u-') or we know we are fully in mock mode
            const urlStr = target.url?.href || '';
            const isMockQuery = urlStr.includes('u-');
            
            if (isMockQuery) {
               const fallbackResult = await handleMockTableQuery(tableName, target);
               return onfulfilled ? onfulfilled(fallbackResult) : fallbackResult;
            }

            const result = await target;
            if (result && result.error) {
               console.warn(\`Supabase query error detected on table "\${tableName}" (\${result.error.message || ''}), falling back to mock database...\`);
               const fallbackResult = await handleMockTableQuery(tableName, target);
               return onfulfilled ? onfulfilled(fallbackResult) : fallbackResult;
            }
            
            // If it's a select query for a mock user but somehow didn't error (e.g. returned 0 rows)
            if (result && !result.error && (!result.data || result.data.length === 0) && isMockQuery) {
               const fallbackResult = await handleMockTableQuery(tableName, target);
               return onfulfilled ? onfulfilled(fallbackResult) : fallbackResult;
            }

            return onfulfilled ? onfulfilled(result) : result;
          } catch (err: any) {
             console.warn(\`Supabase exception detected on table "\${tableName}", falling back to mock database...\`);
             const fallbackResult = await handleMockTableQuery(tableName, target);
             return onfulfilled ? onfulfilled(fallbackResult) : fallbackResult;
          }
        };
      }
`;

content = content.replace(/get\(target, prop, receiver\) \{\s*if \(prop === 'then'\) \{\s*return async function\(onfulfilled: any, onrejected: any\) \{\s*try \{\s*const result = await target;/, replacement.replace('const result = await target;', '').trim());

fs.writeFileSync('services/supabaseClient.ts', content, 'utf8');
console.log('patched short circuit');
