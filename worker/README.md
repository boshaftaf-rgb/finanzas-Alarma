# Worker Python (desarrollo local)

> **Producción:** el worker corre en **Vercel Cron** (`api/cron/evaluate` + `lib/` TypeScript).  
> Ver [docs/adr/001-worker-en-vercel.md](../docs/adr/001-worker-en-vercel.md).

Este módulo Python sirve para:

- Prototipos y tests locales con fixtures
- Comparar resultados con la implementación TypeScript

```bash
pip install -r worker/requirements.txt
python scripts/generate_fixtures.py
python -m worker.main --once
```
