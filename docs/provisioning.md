# Provisioning de servicios externos

Guía para el **operador** del sistema. Corresponde al [Issue #1 — Servicios externos](issues/01-servicios-externos.md) (orden de implementación #1).

Objetivo: tener cuentas y claves listas **antes** de escribir código de producto (migraciones, worker, frontend).

---

## Resumen de servicios

| Servicio | Para qué | Cuándo hace falta |
|----------|----------|-------------------|
| **Supabase** | PostgreSQL, alertas, estado del worker | Desde el issue #2 (migraciones) |
| **Twelve Data** | Velas OHLCV de 15 min (batch) | Desde el issue #6 (worker + batch) |
| **Gmail SMTP** | Emails de alerta en español | Desde el issue #7 (Gmail SMTP + candle-lock) |
| **Vercel** | Panel web React | Fase 3 — pospuesto |

---

## 1. Supabase

1. Crear cuenta en [supabase.com](https://supabase.com).
2. **New project** → elige región cercana y contraseña de base de datos (guárdala en un gestor de contraseñas).
3. Espera a que el proyecto termine de aprovisionarse.
4. Ve a **Project Settings → API** y copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Seguridad

- `SUPABASE_SERVICE_ROLE_KEY` **solo** en el contenedor Docker del worker (`.env` local, no commitear).
- **Nunca** la pongas en variables `VITE_*` ni en Vercel.
- En v1 no se configura Auth todavía; solo necesitas la base de datos.

---

## 2. Twelve Data

1. Registrarse en [twelvedata.com](https://twelvedata.com).
2. Plan **free**: 800 peticiones/día, 8 req/min (suficiente con batching — ver [ARCHITECTURE.md](ARCHITECTURE.md)).
3. **Account → API Keys** → crear o copiar la clave → `TWELVE_DATA_API_KEY`.

---

## 3. Gmail SMTP

1. Usa una cuenta de Gmail con **verificación en dos pasos (2FA)** activada.
2. Crea una **App Password** en [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) → `SMTP_APP_PASSWORD`.
3. Configura el remitente:
   - `SMTP_HOST=smtp.gmail.com` (valor por defecto)
   - `SMTP_PORT=587` (STARTTLS)
   - `SMTP_USER` → tu dirección Gmail (ej. `tucuenta@gmail.com`)
4. Define el email de papá en v1 → `ALERT_RECIPIENT_EMAIL`.

Puedes reutilizar la misma App Password que ya uses en otro proyecto, siempre que sea la misma cuenta remitente. El worker limita a 10 correos por alerta/día; Gmail permite ~500/día en cuentas personales (sobra para v1).

---

## 4. Configurar el repositorio

```bash
# Desde la raíz del repo
cp .env.example .env
```

Edita `.env` con todas las claves. El archivo `.env` está en `.gitignore` y no debe subirse a git.

### Variables por componente

| Variable | Worker Docker | Frontend (Vercel, Fase 3) |
|----------|:-------------:|:---------------------------:|
| `SUPABASE_URL` | ✓ | — |
| `SUPABASE_ANON_KEY` | — | vía `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | ✗ nunca |
| `TWELVE_DATA_API_KEY` | ✓ | ✗ |
| `SMTP_HOST` | ✓ | ✗ |
| `SMTP_PORT` | ✓ | ✗ |
| `SMTP_USER` | ✓ | ✗ |
| `SMTP_APP_PASSWORD` | ✓ | ✗ |
| `ALERT_RECIPIENT_EMAIL` | ✓ | ✗ |
| `VITE_SUPABASE_URL` | — | ✓ |
| `VITE_SUPABASE_ANON_KEY` | — | ✓ |

---

## 5. Vercel (pospuesto — Fase 3)

Cuando exista el panel React:

1. Cuenta en [vercel.com](https://vercel.com).
2. Importar repo; root directory: `frontend/`.
3. Variables de entorno en el dashboard: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

No hace falta crear la cuenta Vercel en esta fase.

---

## Checklist de aceptación (Issue #1)

- [ ] Proyecto Supabase creado y accesible
- [ ] Claves Supabase (anon + service_role) obtenidas y guardadas **fuera del repo**
- [ ] API key Twelve Data obtenida
- [ ] App Password de Gmail creada y guardada fuera del repo
- [ ] `.env.example` en el repo (plantilla sin secretos)
- [ ] `.env` local creado a partir de la plantilla (no commiteado)
- [ ] Esta guía revisada

---

## Siguiente paso

Según [orden de implementación](issues/00-orden-implementacion.md): **migración `alerts` + seed SQL** (issue #2 en docs, GitHub #4 Fase 2a).
