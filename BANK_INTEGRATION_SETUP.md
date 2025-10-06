# Sistema Completo de Detección Automática y Notificaciones Proactivas

Este documento explica cómo funciona el sistema completo de integración bancaria y notificaciones inteligentes de Moni.

## 🎯 Características Implementadas

### 1. Detección Automática de Transacciones Bancarias
- **Sincronización en tiempo real** con cuentas bancarias
- **Categorización automática** con IA
- **Alertas instantáneas** cuando ocurre una transacción

### 2. Notificaciones Proactivas de WhatsApp
- **Mensajes automáticos** sin que el usuario inicie la conversación
- **Alertas inteligentes** de gastos excesivos
- **Recomendaciones personalizadas** de ahorro
- **Recordatorios** de metas y presupuestos
- **Resúmenes** diarios y semanales

### 3. IA Inteligente y Personalizada
- Analiza patrones de gasto
- Detecta anomalías
- Genera insights personalizados
- Adapta mensajes al perfil del usuario

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        APIs Bancarias                        │
│              (Plaid, Belvo, Open Banking)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ Webhooks en tiempo real
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  bank-webhook (Edge Function)                │
│              Recibe notificaciones bancarias                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            sync-bank-transactions (Edge Function)            │
│         • Obtiene transacciones del banco                    │
│         • Categoriza con IA                                  │
│         • Guarda en base de datos                            │
│         • Verifica umbrales de alerta                        │
└────────────────────────┬────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
┌──────────────────────┐  ┌──────────────────────┐
│  categorize-         │  │  send-proactive-     │
│  transaction         │  │  message             │
│  (IA Gemini)         │  │  (IA + WhatsApp)     │
└──────────────────────┘  └──────────────────────┘
                                    │
                                    ▼
                         ┌────────────────────┐
                         │   Usuario recibe   │
                         │   mensaje WhatsApp │
                         └────────────────────┘
```

## 📊 Base de Datos

### Nuevas Tablas

#### 1. `bank_connections`
Almacena conexiones bancarias de usuarios:
```sql
- user_id: Usuario propietario
- bank_name: Nombre del banco
- account_id: ID de la cuenta
- access_token: Token de acceso (encriptado)
- plaid_item_id: ID del item de Plaid
- last_sync: Última sincronización
- is_active: Si está activa
```

#### 2. `notification_settings`
Configuración de notificaciones por usuario:
```sql
- daily_summary: Resumen diario (bool)
- weekly_analysis: Análisis semanal (bool)
- spending_alerts: Alertas de gasto (bool)
- savings_tips: Tips de ahorro (bool)
- goal_reminders: Recordatorios de metas (bool)
- daily_spending_limit: Límite diario de gasto
- transaction_alert_threshold: Umbral de alerta por transacción
- preferred_notification_time: Hora preferida para notificaciones
- quiet_hours_start: Inicio de horario silencioso
- quiet_hours_end: Fin de horario silencioso
```

#### 3. `notification_history`
Historial de notificaciones enviadas:
```sql
- user_id: Usuario
- notification_type: Tipo de notificación
- message: Mensaje enviado
- sent_at: Fecha y hora de envío
- status: Estado (sent, failed, read)
- metadata: Datos adicionales (JSON)
```

## 🔧 Edge Functions

### 1. **bank-webhook**
- **Propósito**: Recibir webhooks de APIs bancarias
- **Trigger**: Webhook de Plaid/Belvo
- **Acción**: Iniciar sincronización de transacciones

### 2. **sync-bank-transactions**
- **Propósito**: Sincronizar transacciones bancarias
- **Trigger**: Llamada desde bank-webhook
- **Acciones**:
  - Obtener transacciones del banco
  - Categorizar con IA
  - Guardar en base de datos
  - Verificar alertas
  - Enviar notificaciones si es necesario

### 3. **categorize-transaction**
- **Propósito**: Categorizar transacciones con IA
- **Modelo**: Gemini 2.5 Flash
- **Entrada**: Descripción, monto, tipo, comerciante
- **Salida**: Categoría, confianza, razón

### 4. **send-proactive-message**
- **Propósito**: Enviar mensajes proactivos por WhatsApp
- **Tipos de mensajes**:
  - `spending_alert`: Alerta de gasto importante
  - `daily_limit_exceeded`: Límite diario superado
  - `savings_tip`: Consejo de ahorro
  - `goal_reminder`: Recordatorio de meta
  - `weekly_summary`: Resumen semanal
  - `spending_pattern`: Patrón de gasto detectado
  - `discount_opportunity`: Oportunidad de descuento

### 5. **scheduled-notifications**
- **Propósito**: Ejecutar notificaciones programadas
- **Trigger**: Cron job (cada hora)
- **Acciones**:
  - Resumen diario (hora preferida del usuario)
  - Análisis semanal (lunes 9am)
  - Tips de ahorro (miércoles y sábado 10am)
  - Recordatorios de metas (cada 3 días 6pm)

## 🚀 Configuración Paso a Paso

### Paso 1: Configurar Plaid (Open Banking)

1. **Crear cuenta en Plaid**:
   - Ve a [Plaid Dashboard](https://dashboard.plaid.com/)
   - Crea una cuenta de desarrollo
   - Crea una nueva aplicación

2. **Obtener credenciales**:
   ```
   PLAID_CLIENT_ID=tu_client_id
   PLAID_SECRET=tu_secret
   PLAID_ENV=sandbox  # sandbox, development, o production
   ```

3. **Configurar webhook**:
   ```
   https://gfojxewccmjwdzdmdfxv.supabase.co/functions/v1/bank-webhook
   ```

### Paso 2: Agregar Secretos en Lovable Cloud

```bash
PLAID_CLIENT_ID=tu_client_id_aqui
PLAID_SECRET=tu_secret_aqui
PLAID_ENV=sandbox
WHATSAPP_TOKEN=tu_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
```

### Paso 3: Configurar Cron Job para Notificaciones

En Supabase, crea un cron job para ejecutar cada hora:

```sql
select cron.schedule(
  'scheduled-notifications',
  '0 * * * *', -- cada hora
  $$
  select
    net.http_post(
        url:='https://gfojxewccmjwdzdmdfxv.supabase.co/functions/v1/scheduled-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer TU_ANON_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

## 📱 Flujo de Usuario

### Flujo de Detección Automática

```
1. Usuario conecta su banco en la app
   ↓
2. Plaid verifica la conexión
   ↓
3. Usuario hace una compra de $500 en Walmart
   ↓
4. Banco procesa la transacción
   ↓
5. Plaid detecta la transacción (en segundos)
   ↓
6. Plaid envía webhook a bank-webhook
   ↓
7. sync-bank-transactions obtiene detalles
   ↓
8. categorize-transaction usa IA:
   - Descripción: "WALMART SUPERCENTER"
   - IA determina: Categoría "Supermercado", Gasto
   ↓
9. Se guarda en base de datos
   ↓
10. Sistema verifica si $500 > umbral de alerta ($500)
   ↓
11. send-proactive-message genera mensaje con IA:
    "🚨 Hola! Detecté un gasto de $500 en Walmart.
    Parece que fuiste al super. ¿Estuvo dentro de tu
    presupuesto? 💰"
   ↓
12. Usuario recibe mensaje en WhatsApp inmediatamente
```

### Tipos de Notificaciones Proactivas

#### 1. **Alertas de Gasto en Tiempo Real**
```
Usuario gasta $800 en restaurante
↓
"🍽️ Oye, acabas de gastar $800 en un restaurante.
Eso es más de tu presupuesto usual para comidas.
¿Todo bien? 💸"
```

#### 2. **Límite Diario Alcanzado**
```
Usuario supera $1000 en un día
↓
"⚠️ ¡Alto ahí! Ya gastaste $1,200 hoy y tu límite
es $1,000. Tal vez es hora de hacer una pausa. 💰"
```

#### 3. **Resumen Diario**
```
Cada día a las 9pm:
↓
"📊 Resumen de hoy:
• Gastaste: $450
• Ingresos: $0
• Balance: -$450

Categorías principales:
1. Comida: $280
2. Transporte: $120
3. Entretenimiento: $50

¡Mañana será mejor! 💪"
```

#### 4. **Análisis Semanal**
```
Cada lunes a las 9am:
↓
"📈 Resumen de la semana pasada:
• Gastaste: $2,800
• 15% más que la semana anterior
• Tu categoría más alta: Comida ($1,200)

💡 Consejo: Intenta cocinar más en casa esta
semana para reducir gastos en comida. 🍳"
```

#### 5. **Tips de Ahorro**
```
Miércoles y sábado a las 10am:
↓
"💡 Tip del día: ¿Sabías que al comprar genéricos
en lugar de marcas puedes ahorrar hasta 30% en tu
super? Pequeños cambios = grandes ahorros! 🌟"
```

#### 6. **Recordatorios de Metas**
```
Cada 3 días a las 6pm:
↓
"🎯 Recuerda tu meta: 'Vacaciones 2025'
Has ahorrado $8,500 de $15,000 (57%)

¡Solo te faltan $6,500! Si ahorras $500 semanales,
lo logras en 13 semanas. ¡Tú puedes! 💪"
```

#### 7. **Detección de Patrones**
```
IA detecta gasto inusual:
↓
"🤔 Noté algo diferente... Normalmente gastas $50
al mes en apps, pero este mes ya llevas $150.
¿Nuevas suscripciones? Revisa que no tengas cargos
duplicados. 🔍"
```

#### 8. **Oportunidades de Ahorro**
```
"💰 ¡Buenas noticias! Detecté que podrías ahorrar
$200 al mes si cambias tu plan de celular. Tu gasto
promedio es de $800 pero hay planes de $600 con los
mismos beneficios. ¿Lo revisamos? 📱"
```

## 🎨 Configuración de Notificaciones (Frontend)

Crea una página en `/settings/notifications` donde los usuarios puedan:

1. **Activar/Desactivar tipos de notificaciones**:
   - ✅ Resumen diario
   - ✅ Análisis semanal
   - ✅ Alertas de gasto
   - ✅ Tips de ahorro
   - ✅ Recordatorios de metas

2. **Configurar umbrales**:
   - Límite de gasto diario: $1,000
   - Alerta por transacción mayor a: $500

3. **Horarios preferidos**:
   - Hora de notificaciones diarias: 9:00 PM
   - Horario silencioso: 10:00 PM - 8:00 AM

## 🔐 Seguridad

1. **Tokens bancarios**: Siempre encriptados en la base de datos
2. **RLS policies**: Solo el usuario puede ver sus propias conexiones
3. **Webhooks**: Verificados con tokens de seguridad
4. **Datos sensibles**: Nunca se registran en logs

## 📊 Métricas y Monitoreo

Monitorea el sistema con:

```sql
-- Transacciones sincronizadas hoy
SELECT COUNT(*) FROM transactions 
WHERE payment_method = 'bank_sync' 
AND transaction_date = CURRENT_DATE;

-- Notificaciones enviadas en la última hora
SELECT notification_type, COUNT(*) 
FROM notification_history 
WHERE sent_at > NOW() - INTERVAL '1 hour'
GROUP BY notification_type;

-- Usuarios con cuentas bancarias activas
SELECT COUNT(*) FROM bank_connections WHERE is_active = true;
```

## 🐛 Solución de Problemas

### Las transacciones no se detectan automáticamente

1. Verifica que el webhook esté configurado en Plaid
2. Revisa los logs de `bank-webhook`
3. Confirma que `PLAID_CLIENT_ID` y `PLAID_SECRET` estén configurados
4. Verifica que la cuenta bancaria esté activa en Plaid

### Las notificaciones no se envían

1. Verifica que el usuario tenga WhatsApp conectado
2. Confirma que las notificaciones estén activadas en `notification_settings`
3. Revisa que no esté en horario silencioso
4. Verifica los tokens de WhatsApp

### La IA no categoriza correctamente

1. Verifica que `LOVABLE_API_KEY` esté configurada
2. Revisa los logs de `categorize-transaction`
3. Asegúrate de que el usuario tenga categorías creadas
4. Verifica que la descripción de la transacción sea clara

## 🚀 Próximas Mejoras

1. **ML Personalizado**: Entrenar modelo con historial del usuario
2. **Predicciones**: Predecir gastos futuros basados en patrones
3. **Comparativas**: "Gastaste 20% menos que usuarios similares"
4. **Gamificación**: Logros por buenos hábitos financieros
5. **Análisis de Sentimiento**: Detectar estrés financiero en mensajes
6. **Recomendaciones de Inversión**: Sugerir dónde invertir ahorros
7. **Alertas de Fraude**: Detectar transacciones sospechosas

## 📚 Recursos

- [Plaid Documentation](https://plaid.com/docs/)
- [Belvo Documentation](https://docs.belvo.com/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Lovable AI Documentation](https://docs.lovable.dev/features/ai)
