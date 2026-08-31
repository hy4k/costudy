const fs = require('fs');

let content = fs.readFileSync('services/fetsService.ts', 'utf8');

const withRetryCode = `
/**
 * Resilient Supabase Operation Wrapper
 * Implements exponential backoff, retry logic, and connection verification.
 */
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> => {
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    try {
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        throw new Error("Network offline. Please check your connection.");
      }

      const result: any = await operation();
      
      // Treat specific Supabase errors as exceptions to trigger retry logic
      if (result && result.error) {
        const status = result.error.status || result.error.code;
        const msg = result.error.message || '';
        if (status == 404 || status >= 500 || msg.includes('FetchError') || msg.includes('Database error') || msg.includes('network') || msg.includes('Failed to fetch')) {
            throw result.error;
        }
      }
      
      return result;
    } catch (error: any) {
      attempt++;
      lastError = error;
      
      const status = error.status || error.code;
      const msg = error.message || '';
      
      const isRetryable = 
        msg.includes('FetchError') ||
        msg.includes('NetworkError') ||
        msg.includes('network') ||
        msg.includes('Failed to fetch') ||
        msg.includes('Database error') ||
        status == 404 ||
        status >= 500 ||
        status === 'PGRST116' ||
        status == 502 ||
        status == 503;

      if (!isRetryable || attempt >= maxRetries) {
        return { data: null, error: lastError } as any;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 200;
      console.warn(\`[CoStudy Network Guard] Query failed (\${status || msg}). Retrying in \${Math.round(delay)}ms... (Attempt \${attempt}/\${maxRetries})\`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  
  return { data: null, error: lastError || new Error("Operation failed after maximum retries") } as any;
};
`;

// Insert the code
content = content.replace("export const COSTUDY_CONFIG =", withRetryCode + "\nexport const COSTUDY_CONFIG =");

// Replace auth methods
content = content.replace(/await supabase\.auth\.signUp\(([\s\S]*?)\);/g, "await withRetry(() => supabase.auth.signUp($1));");
content = content.replace(/await supabase\.auth\.signInWithPassword\(([\s\S]*?)\);/g, "await withRetry(() => supabase.auth.signInWithPassword($1));");
content = content.replace(/await supabase\.auth\.resetPasswordForEmail\(([\s\S]*?)\);/g, "await withRetry(() => supabase.auth.resetPasswordForEmail($1));");
content = content.replace(/await supabase\.auth\.signOut\(\);/g, "await withRetry(() => supabase.auth.signOut());");
content = content.replace(/await supabase\.auth\.getSession\(\);/g, "await withRetry(() => supabase.auth.getSession());"); 

// Replace from methods
content = content.replace(/await supabase\s*\.from\('user_profiles'\)\s*\.select\('\*'\)\s*\.eq\('id', userId\)\s*\.maybeSingle\(\);/g, 
  "await withRetry(() => supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle());");

content = content.replace(/await supabase\s*\.from\('user_profiles'\)\s*\.upsert\(newProfile, \{ onConflict: 'id' \}\);/g,
  "await withRetry(() => supabase.from('user_profiles').upsert(newProfile, { onConflict: 'id' }));");

content = content.replace(/await supabase\s*\.from\('user_profiles'\)\s*\.update\(dbUpdates\)\s*\.eq\('id', userId\)\s*\.select\(\);/g,
  "await withRetry(() => supabase.from('user_profiles').update(dbUpdates).eq('id', userId).select());");

content = content.replace(/await supabase\s*\.from\('mcq_questions'\)\s*\.select\('\*'\);/g,
  "await withRetry(() => supabase.from('mcq_questions').select('*'));");

content = content.replace(/await supabase\s*\.from\('essay_questions'\)\s*\.select\('\*'\)\s*\.limit\(count\);/g,
  "await withRetry(() => supabase.from('essay_questions').select('*').limit(count));");

content = content.replace(/await supabase\s*\.from\('essay_responses'\)\s*\.insert\(\[\s*\{\s*user_id: userId,\s*question_id: payload\.question_id,\s*response_text: payload\.response_text,\s*submitted_at: submittedAt\s*\}\s*\]\);/g,
  "await withRetry(() => supabase.from('essay_responses').insert([\n                {\n                    user_id: userId,\n                    question_id: payload.question_id,\n                    response_text: payload.response_text,\n                    submitted_at: submittedAt\n                }\n            ]));");

content = content.replace(/await supabase\s*\.from\('essay_responses'\)\s*\.insert\(records\);/g,
  "await withRetry(() => supabase.from('essay_responses').insert(records));");

fs.writeFileSync('services/fetsService.ts', content, 'utf8');
console.log('fetsService.ts patched successfully');
