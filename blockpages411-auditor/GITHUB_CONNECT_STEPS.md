# Connect Blockpages411 Auditor v8 to GitHub

## 1. Unzip package

```bash
unzip blockpages411-auditor-v8.zip
cd blockpages411-auditor-v8
```

## 2. Prepare local environment only

```bash
cp .env.example .env
openssl rand -hex 32
```

Paste the generated value into `.env`:

```env
ADMIN_API_KEY=<generated-secret>
```

Do not commit `.env`.

## 3. Run final checks

```bash
cd backend
npm install
npm run syntax
npm run test:readiness
cd ..
```

## 4. Optional Docker smoke test

```bash
docker compose up --build
```

Then test:

```bash
curl http://localhost:4000/health
curl -X POST http://localhost:4000/audits \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## 5. Initialize Git

```bash
git init
git add .
git status
```

Confirm `.env` is not staged.

## 6. Commit

```bash
git commit -m "Add Blockpages411 Auditor v8"
git branch -M main
```

## 7. Connect remote

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## 8. After GitHub connection

Recommended next tasks:

```text
add GitHub Actions syntax/readiness CI
connect deployment target
seed threat-intel datasets
configure alert webhook
set production ALLOWED_ORIGIN
configure persistent storage
run controlled QA scans
```
