# Sistema de Retos Diarios - Configuración

## Descripción

Sistema automático de retos diarios que:
1. **Envía retos diarios por WhatsApp** a las 8:00 AM
2. **Verifica automáticamente** el cumplimiento con IA a las 11:59 PM
3. **Calcula racha** de días consecutivos cumpliendo retos

## Base de Datos

### Tablas Creadas

**`daily_challenges`** - Retos disponibles del sistema
- `title`: Título del reto
- `description`: Descripción detallada
- `challenge_type`: Tipo (`budget_limit`, `no_spending`, `manual_entry`, `savings`)
- `target_amount`: Meta numérica (si aplica)
- `category`: Categoría específica
- `xp_reward`: Puntos XP por completar

**`user_daily_challenges`** - Retos asignados a usuarios
- `user_id`: Usuario
- `challenge_id`: Reto asignado
- `challenge_date`: Fecha del reto
- `status`: Estado (`pending_verification`, `active`, `completed`, `failed`)
- `completed`: Booleano de completado
- `ai_verification_result`: Resultado de verificación IA

## Edge Functions

### 1. `send-daily-challenge`
**Propósito:** Enviar reto diario por WhatsApp

**Flujo:**
1. Obtiene usuarios activos con WhatsApp
2. Selecciona reto aleatorio para cada usuario
3. Envía mensaje por WhatsApp
4. Crea registro en `user_daily_challenges` con estado `pending_verification`

**Mensaje de WhatsApp:**
```
🎯 *Reto del día*

*[Título del reto]*

[Descripción]

✨ Recompensa: XX XP

Responde "Acepto" para activar este reto.
```

### 2. `verify-daily-challenge`
**Propósito:** Verificar automáticamente cumplimiento de retos

**Flujo:**
1. Obtiene retos activos del día
2. Analiza transacciones del usuario
3. Verifica según tipo de reto:
   - **budget_limit**: Gasto total ≤ límite
   - **no_spending**: Sin gastos en categoría específica
   - **manual_entry**: Cantidad de registros manuales ≥ objetivo
   - **savings**: Monto ahorrado ≥ objetivo
4. Usa IA (Lovable AI/Gemini) para análisis adicional
5. Actualiza estado y marca como completado/fallido
6. Otorga XP si completó

### 3. `whatsapp-webhook` (Actualizado)
**Propósito:** Manejar aceptación de retos

**Nueva funcionalidad:**
- Detecta palabras clave: "acepto", "aceptar", "si", "ok", "vale", "dale", "claro"
- Cambia estado de `pending_verification` a `active`
- Confirma activación por WhatsApp

## Configuración de Cron Jobs

### ⚠️ IMPORTANTE: Configuración Manual Requerida

Ejecuta estos comandos SQL en Supabase SQL Editor para programar las funciones:

```sql
-- 1. Enviar retos diarios a las 8:00 AM (hora del servidor UTC)
-- Ajusta la hora según tu zona horaria
SELECT cron.schedule(
  'send-daily-challenges',
  '0 8 * * *', -- 8:00 AM todos los días
  $$
  SELECT net.http_post(
    url:='https://gfojxewccmjwdzdmdfxv.supabase.co/functions/v1/send-daily-challenge',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- 2. Verificar retos a las 11:59 PM (hora del servidor UTC)
SELECT cron.schedule(
  'verify-daily-challenges',
  '59 23 * * *', -- 11:59 PM todos los días
  $$
  SELECT net.http_post(
    url:='https://gfojxewccmjwdzdmdfxv.supabase.co/functions/v1/verify-daily-challenge',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

**Reemplaza:**
- `YOUR_ANON_KEY` con tu `SUPABASE_ANON_KEY` real

### Ver Cron Jobs Activos

```sql
SELECT * FROM cron.job;
```

### Eliminar Cron Jobs

```sql
SELECT cron.unschedule('send-daily-challenges');
SELECT cron.unschedule('verify-daily-challenges');
```

## Tipos de Retos Implementados

### 1. Límite de presupuesto (`budget_limit`)
Verificación: Suma total de gastos ≤ `target_amount`

**Ejemplo:** "Ahorra $100 hoy" - No gastes más de $100 pesos

### 2. Sin gastos en categoría (`no_spending`)
Verificación: Cero gastos en categoría específica

**Ejemplo:** "Día sin entretenimiento" - No gastes en entretenimiento

### 3. Registros manuales (`manual_entry`)
Verificación: Cantidad de transacciones manuales ≥ `target_amount`

**Ejemplo:** "Registra todos tus gastos" - Al menos 3 registros manuales

### 4. Ahorro objetivo (`savings`)
Verificación: Monto en transacciones de ahorro ≥ `target_amount`

**Ejemplo:** "Ahorra $200 hoy" - Registra al menos $200 en ahorros

## Cálculo de Racha

La racha se calcula en `src/pages/SocialStats.tsx`:

```typescript
// Obtiene últimos 30 días de retos
const { data: challengeHistory } = await supabase
  .from('user_daily_challenges')
  .select('challenge_date, completed')
  .eq('user_id', user.id)
  .order('challenge_date', { ascending: false })
  .limit(30);

// Cuenta días consecutivos desde hoy hacia atrás
let streak = 0;
for (día en historia) {
  if (día es consecutivo Y completado) {
    streak++;
  } else {
    break; // Rompe la racha
  }
}
```

## Flujo Completo Usuario

1. **8:00 AM** - Usuario recibe reto por WhatsApp
2. **Usuario responde** "Acepto" - Reto se activa
3. **Durante el día** - Usuario realiza transacciones normalmente
4. **11:59 PM** - IA verifica automáticamente:
   - Analiza transacciones bancarias y manuales
   - Valida cumplimiento según tipo de reto
   - Usa Lovable AI para análisis contextual
5. **Resultado:**
   - ✅ Completado → XP otorgado, racha actualizada
   - ❌ Fallido → Racha se resetea

## Verificación con IA

La IA (Gemini 2.5 Flash) analiza:
- Transacciones del día
- Descripción del reto
- Contexto y categorías
- Patrones de gasto

Genera análisis textual guardado en `ai_verification_result`.

## Seguridad

- ✅ RLS habilitado en todas las tablas
- ✅ Verificación de firma WhatsApp
- ✅ Rate limiting en webhook
- ✅ Validación de entrada
- ✅ Logs de auditoría

## Monitoreo

### Ver logs de envío de retos
```typescript
// En Supabase Edge Functions Logs
// Buscar función: send-daily-challenge
```

### Ver logs de verificación
```typescript
// En Supabase Edge Functions Logs
// Buscar función: verify-daily-challenge
```

### Verificar estado de retos
```sql
SELECT 
  u.user_id,
  c.title,
  u.status,
  u.completed,
  u.challenge_date
FROM user_daily_challenges u
JOIN daily_challenges c ON u.challenge_id = c.id
WHERE u.challenge_date = CURRENT_DATE
ORDER BY u.user_id;
```

## Troubleshooting

### Los retos no se envían
1. Verificar que hay usuarios en `whatsapp_users` con `is_active = true`
2. Verificar credenciales WhatsApp configuradas
3. Revisar logs de `send-daily-challenge`

### La verificación no funciona
1. Verificar que hay transacciones registradas
2. Revisar logs de `verify-daily-challenge`
3. Verificar que `LOVABLE_API_KEY` está configurada

### La racha no se actualiza
1. Verificar que los retos tienen `completed = true`
2. Verificar fechas consecutivas en `user_daily_challenges`
3. Revisar lógica en `src/pages/SocialStats.tsx`

## Próximas Mejoras

- [ ] Personalización de retos según historial del usuario
- [ ] Niveles de dificultad adaptativos
- [ ] Retos colaborativos entre amigos
- [ ] Notificaciones push además de WhatsApp
- [ ] Dashboard de administración de retos
