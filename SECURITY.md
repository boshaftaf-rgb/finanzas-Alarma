---
version: "1.0"
name: stock-alerts-secure-coding-guide
description: >-
  Guía obligatoria de código seguro para Stock Alerts (finanzas-Alarma). Basada en OWASP Top 10,
  CWE y buenas prácticas de programación defensiva. Complementa sec-expert para
  auditorías puntuales; este documento define el estándar permanente del repositorio.
references:
  - OWASP Top 10 (2021)
  - CWE/SANS Top 25
  - OWASP ASVS (Application Security Verification Standard)
---

# Seguridad — guía de código seguro (Stock Alerts)

Documento de referencia **obligatorio** para todo código nuevo o modificado en este repositorio. Antes de implementar auth, formularios, APIs o manejo de datos sensibles, revisa esta guía.

Para auditorías profundas o reportes con CVSS y parches, invoca explícitamente el agente **Sec Expert** (skill `sec-expert`).

---

## Principios generales

1. **Defensa en profundidad:** no confíes en una sola capa (cliente, servidor, red, BD).
2. **Mínimo privilegio:** permisos, tokens y datos solo lo estrictamente necesario.
3. **Fail secure:** ante error o duda, denegar acceso; no exponer detalles internos.
4. **Validar en servidor:** todo lo del cliente es manipulable; la validación crítica va en backend (Supabase RLS, triggers, worker).
5. **Sin secretos en código:** API keys, contraseñas y tokens nunca en repo, bundle del frontend ni logs.
6. **Rotación inmediata:** si un secreto aparece en código, commits o logs, rotarlo y notificar al equipo.

---

## OWASP Top 10 — ataques principales y mitigaciones

Cada hallazgo de seguridad debe mapearse a **OWASP** y, cuando aplique, a **CWE**.

### A01 — Broken Access Control (control de acceso roto)

**Ataques:** IDOR, escalada horizontal/vertical de privilegios, rutas admin sin protección, manipulación de IDs en URL/body.

| CWE | Mitigación |
|-----|------------|
| CWE-639 | Autorización en **cada** endpoint; no confiar en ocultar URLs |
| CWE-862 | Verificar rol/recurso en servidor, no solo autenticación |
| CWE-285 | Política deny-by-default; listas blancas de roles |

**Prácticas:**
- Comprobar que el usuario autenticado **es dueño** del recurso solicitado (`user_id = auth.uid()` en RLS).
- No usar parámetros del cliente (`role=admin`, `userId`) como fuente de verdad.
- `SUPABASE_SERVICE_ROLE_KEY` solo en el contenedor Docker del worker; nunca en Vercel ni en `VITE_*`.

---

### A02 — Cryptographic Failures (fallos criptográficos)

**Ataques:** datos sensibles en texto plano, TLS débil, contraseñas sin hash fuerte, tokens predecibles.

| CWE | Mitigación |
|-----|------------|
| CWE-311 | Cifrar datos sensibles en tránsito (HTTPS) y en reposo |
| CWE-327 | Algoritmos actuales: bcrypt/Argon2/scrypt para contraseñas; AES-256 para datos |
| CWE-798 | Nunca hardcodear claves ni contraseñas |

**Prácticas:**
- HTTPS obligatorio en producción (Vercel); HSTS cuando aplique.
- No almacenar contraseñas en `localStorage`, cookies sin `HttpOnly` ni logs.
- No mostrar en UI afirmaciones de seguridad (ej. «TLS 1.3») sin verificación real.

---

### A03 — Injection (inyección)

**Ataques:** SQLi, NoSQLi, OS command injection, LDAP, template injection.

| CWE | Mitigación |
|-----|------------|
| CWE-89 | Consultas parametrizadas / ORM; nunca concatenar SQL con input |
| CWE-78 | Evitar `exec`/`eval` con input; listas blancas de comandos |
| CWE-79 | Ver también XSS (inyección en contexto HTML) |

**Prácticas:**
- Validar **tipo, longitud y formato** en servidor (tickers, parámetros EMA/RSI).
- Escapar/sanitizar según contexto (HTML, SQL, shell, JSON).
- ORM con parámetros enlazados; migraciones Supabase sin SQL dinámico inseguro.

---

### A04 — Insecure Design (diseño inseguro)

**Ataques:** flujos sin threat modeling, lógica de negocio explotable, ausencia de rate limiting.

| CWE | Mitigación |
|-----|------------|
| CWE-840 | Modelar amenazas en auth, alertas, invitaciones y worker |
| CWE-307 | Rate limiting y lockout en login y endpoints sensibles |

**Prácticas:**
- Revisar flujos de alertas contra bypass de límites (15 tickers, 5 alertas/ticker, 10 emails/día).
- Límites de intentos, backoff en autenticación y recuperación de cuenta.
- Separar ambientes (dev/staging/prod) y datos de prueba anonimizados.

---

### A05 — Security Misconfiguration (configuración insegura)

**Ataques:** headers ausentes, CORS permisivo, debug en producción, directorios listables, dependencias obsoletas.

| CWE | Mitigación |
|-----|------------|
| CWE-16 | Hardening de servidor, framework y CDN |
| CWE-200 | Desactivar stack traces y mensajes verbosos en producción |

**Headers recomendados (Vercel/CDN):**

```
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY (o frame-ancestors en CSP)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), ...
Strict-Transport-Security: max-age=31536000; includeSubDomains (solo HTTPS)
```

**Prácticas:**
- CORS: orígenes explícitos, no `*` con credenciales.
- Deshabilitar endpoints de debug y consolas admin por defecto.
- Mantener dependencias actualizadas; auditar con `npm audit` / `pip audit`.

---

### A06 — Vulnerable and Outdated Components (componentes vulnerables)

**Ataques:** librerías con CVE conocidos, CDN sin integridad, plugins abandonados.

| CWE | Mitigación |
|-----|------------|
| CWE-1104 | Inventario de dependencias; parches regulares |

**Prácticas:**
- Fijar versiones; revisar advisories antes de merge.
- CDN externos: usar **SRI** (`integrity` + `crossorigin`) en `<script>` y `<link>`.

---

### A07 — Identification and Authentication Failures (fallos de autenticación)

**Ataques:** fuerza bruta, credential stuffing, sesiones fijas, MFA ausente, recuperación de contraseña débil.

| CWE | Mitigación |
|-----|------------|
| CWE-287 | Auth robusta en servidor; no simular login solo en cliente |
| CWE-384 | Regenerar ID de sesión tras login |
| CWE-613 | Timeout de sesión; cierre en logout |

**Prácticas:**
- Validación de credenciales **solo en backend** (Supabase Auth); el front solo envía y muestra estado.
- Cookies de sesión: `HttpOnly`, `Secure`, `SameSite=Lax` o `Strict`.
- JWT: corta vida, refresh rotables, no guardar en `localStorage` si hay riesgo XSS.
- Códigos de invitación de un solo uso; validar y marcar usados en servidor.

---

### A08 — Software and Data Integrity Failures (integridad)

**Ataques:** supply chain, CI/CD sin verificación, deserialización insegura, actualizaciones sin firma.

| CWE | Mitigación |
|-----|------------|
| CWE-502 | No deserializar datos no confiables |
| CWE-829 | Verificar origen de artefactos y paquetes |

**Prácticas:**
- Proteger pipelines CI/CD; secrets en vault, no en variables planas en logs.
- Verificar checksums de dependencias críticas.

---

### A09 — Security Logging and Monitoring Failures (logging y monitoreo)

**Ataques:** incidentes sin detección, logs sin alertas, borrado de evidencia.

| CWE | Mitigación |
|-----|------------|
| CWE-778 | Registrar eventos de auth, autorización fallida y cambios críticos |
| CWE-532 | No loguear contraseñas, tokens ni PII completa |

**Prácticas:**
- Logs estructurados del worker en español; sin API keys ni `service_role`.
- Alertas en picos de 401/403, fallos de login y cambios de permisos.

---

### A10 — Server-Side Request Forgery (SSRF)

**Ataques:** servidor hace peticiones a URLs internas controladas por el atacante.

| CWE | Mitigación |
|-----|------------|
| CWE-918 | Validar URLs; bloquear rangos privados y metadata clouds |

**Prácticas:**
- El worker solo llama a Twelve Data y Supabase con URLs fijas en configuración.
- No pasar URLs crudas del usuario a `fetch`/HTTP client sin validación.

---

## Frontend (React + Vite)

| Área | Riesgo | Práctica segura |
|------|--------|-----------------|
| XSS | CWE-79 | React escapa por defecto; evitar `dangerouslySetInnerHTML` con input |
| Secretos | CWE-798 | Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; nunca `service_role` |
| Formularios | CWE-352 | Supabase maneja CSRF en auth; RLS en datos |
| Enlaces externos | CWE-1022 | `rel="noopener noreferrer"` en `target="_blank"` |
| Almacenamiento | CWE-922 | Preferir sesión Supabase; evaluar riesgo XSS antes de `localStorage` |

**Ejemplo — mostrar error de login:**

```tsx
// Correcto
<p>{message}</p>

// Incorrecto — XSS si message contiene HTML
<div dangerouslySetInnerHTML={{ __html: message }} />
```

---

## Worker (Python + Docker)

| Área | Riesgo | Práctica segura |
|------|--------|-----------------|
| Secretos | CWE-798 | Variables de entorno; `.env` gitignored |
| service_role | CWE-250 | Solo en contenedor; nunca loguear ni exponer |
| SMTP | CWE-319 | STARTTLS en puerto 587; credenciales en env |
| Twelve Data | CWE-200 | No loguear respuestas completas con datos sensibles |

---

## Autenticación y sesión — checklist

- [ ] Validación y verificación de credenciales en **servidor** (Supabase Auth)
- [ ] Rate limiting / lockout tras N intentos fallidos
- [ ] Mensajes de error genéricos («Credenciales inválidas»), sin revelar si el usuario existe
- [ ] Regeneración de ID de sesión tras login exitoso
- [ ] Logout invalida sesión en servidor, no solo en cliente
- [ ] Códigos de invitación: un solo uso, validados en BD
- [ ] RLS en `alerts` e `invite_codes`: `user_id = auth.uid()`
- [ ] Sin contraseñas ni tokens en URL, query strings ni historial del navegador
- [ ] Rotación de secretos si se detectan en repo o logs

---

## Datos sensibles

Stock Alerts maneja configuración de trading y emails de usuarios:

| Marco | Enfoque mínimo |
|-------|----------------|
| **Privacidad** | Minimización de datos, DPA con proveedores (Supabase, Vercel) |
| **Credenciales** | Gmail App Password y API keys solo en `.env` / secrets del contenedor |
| **PII en logs** | No loguear emails completos en producción si no es necesario |

**Nunca** commitear: `.env`, credenciales, dumps de BD. Usar `.gitignore` y secret scanning.

---

## Gestión de secretos

| Hacer | No hacer |
|-------|----------|
| Variables de entorno / vault en runtime | Keys en código fuente, HTML o commits |
| `.env.example` sin valores reales | Subir `.env` al repositorio |
| Rotar tras exposición | Reutilizar la misma key «por comodidad» |
| Secretos distintos por entorno | Misma key en dev y prod |
| `service_role` solo en Docker worker | `VITE_SUPABASE_SERVICE_ROLE_KEY` en frontend |

Si un agente o desarrollador encuentra un secreto en el código: **alertar de inmediato**, no incluir el valor en reportes públicos, sugerir rotación.

---

## Revisión antes de merge (checklist rápido)

- [ ] Entrada de usuario validada y sanitizada en **servidor** (RLS, triggers)
- [ ] Autorización verificada por recurso, no solo autenticación
- [ ] Sin secretos, tokens ni PII innecesaria en código o logs
- [ ] Sin `dangerouslySetInnerHTML` / `eval` con datos no confiables
- [ ] Dependencias sin CVE críticos conocidos
- [ ] Headers de seguridad configurados en Vercel (o plan documentado)
- [ ] Errores de producción no exponen stack traces ni rutas internas
- [ ] Límites de alertas (tickers, emails/día) no bypassables vía parámetros manipulados

---

## Relación con otras guías del repo

| Documento | Rol |
|-----------|-----|
| **`AGENTS.md`** | Indica a agentes leer este archivo antes de código con impacto en seguridad |
| **`CLEAN-CODE.md`** | Arquitectura y legibilidad |
| **`docs/ARCHITECTURE.md`** | Esquema, RLS, worker y flujos técnicos |
| **`sec-expert` (skill)** | Auditoría puntual, CVSS, informe estructurado y parches |

---

## Referencias

- [OWASP Top 10 (2021)](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
