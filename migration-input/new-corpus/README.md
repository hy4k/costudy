# New Corpus Drop Zone

Place your high-quality CMA US CSV files here for staged ingestion.

Required columns are documented in:

- `/root/costudy-api/docs/corpus-ingestion-template.csv`

Suggested workflow:

1. copy files to this folder
2. run `npm run ingest:staging` in `costudy-api`
3. run `npm run triage:staging`
4. run `npm run review:export` and review borderline rows
5. mark approved rows in `ingestion_staging`
6. run `npm run publish:approved`
7. run `npm run backfill:embeddings`
