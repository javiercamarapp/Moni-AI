# Configuración de WhatsApp Business API para Moni

Este documento explica cómo configurar WhatsApp Business API para que los usuarios puedan enviar sus transacciones por WhatsApp y la IA las procese automáticamente.

## Requisitos Previos

1. **Cuenta de Facebook Business Manager**
2. **WhatsApp Business API** (NO la app de WhatsApp Business regular)
3. **Número de teléfono verificado** para WhatsApp Business

## Pasos de Configuración

### 1. Crear una App en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una nueva app de tipo "Business"
3. Agrega el producto "WhatsApp" a tu app

### 2. Configurar WhatsApp Business API

1. En tu app, ve a WhatsApp > Configuración
2. Agrega un número de teléfono para WhatsApp Business
3. Verifica el número de teléfono

### 3. Obtener las Credenciales

Necesitas obtener:

- **WHATSAPP_TOKEN**: Token de acceso permanente de tu app
  - Ve a WhatsApp > Configuración > Token de acceso
  - Genera un token permanente con los permisos necesarios

- **WHATSAPP_PHONE_NUMBER_ID**: ID del número de teléfono
  - Lo encuentras en WhatsApp > Configuración > Números de teléfono
  - Copia el "ID del número de teléfono"

- **WHATSAPP_VERIFY_TOKEN**: Token de verificación (puedes elegir cualquier string)
  - Este lo defines tú mismo (ej: "moni_verify_token_2024")

### 4. Configurar los Secretos en Lovable Cloud

Una vez que tengas las credenciales, agrégalas como secretos:

```bash
WHATSAPP_TOKEN=tu_token_de_acceso_aqui
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id_aqui
WHATSAPP_VERIFY_TOKEN=moni_verify_token_2024
```

### 5. Configurar el Webhook en Meta

1. En tu app de Meta, ve a WhatsApp > Configuración
2. En la sección "Webhooks", haz clic en "Configurar"
3. Ingresa la URL del webhook:
   ```
   https://gfojxewccmjwdzdmdfxv.supabase.co/functions/v1/whatsapp-webhook
   ```
4. Ingresa el token de verificación (el mismo que definiste en WHATSAPP_VERIFY_TOKEN)
5. Haz clic en "Verificar y guardar"

### 6. Suscribirse a los Eventos

En la configuración del webhook, suscríbete a estos eventos:
- `messages` - Para recibir mensajes entrantes

### 7. Probar el Sistema

1. Los usuarios deben registrarse en la app primero
2. Luego conectar su número de WhatsApp en `/whatsapp`
3. Enviar un mensaje de prueba como:
   - "Gasté $500 en comida"
   - "Me pagaron $2000 por freelance"
   - "$120 en gasolina"

## Arquitectura del Sistema

```
Usuario (WhatsApp) 
    ↓
    Mensaje: "Gasté $500 en comida"
    ↓
Meta WhatsApp API
    ↓
Webhook (whatsapp-webhook edge function)
    ↓
    ¿Usuario registrado?
    ├─ No → Enviar link de registro
    └─ Sí → Procesar con IA
        ↓
    Lovable AI (process-transaction edge function)
        ↓
        Interpreta: tipo=gasto, monto=500, categoría=Comida
        ↓
    Guarda en base de datos (transactions table)
        ↓
    Envía confirmación por WhatsApp
        ↓
    Usuario recibe: "✅ Gasto registrado
                     💰 Monto: $500
                     📝 Comida
                     📊 Categoría: Comida"
```

## Edge Functions Implementadas

### 1. whatsapp-webhook
- **Ruta**: `/functions/v1/whatsapp-webhook`
- **Función**: Recibe webhooks de WhatsApp, verifica si el usuario está registrado, y procesa el mensaje

### 2. process-transaction
- **Ruta**: `/functions/v1/process-transaction`
- **Función**: Usa Lovable AI para interpretar el mensaje y extraer información de la transacción

### 3. financial-analysis
- **Ruta**: `/functions/v1/financial-analysis`
- **Función**: Genera análisis financiero completo con métricas, gráficas y proyecciones usando IA

## Tablas de Base de Datos

### whatsapp_users
Vincula números de WhatsApp con usuarios registrados:
- `user_id`: UUID del usuario
- `phone_number`: Número de WhatsApp (formato internacional)
- `is_active`: Si la conexión está activa

### whatsapp_messages
Registra todos los mensajes procesados:
- `user_id`: UUID del usuario
- `phone_number`: Número que envió el mensaje
- `message_text`: Contenido del mensaje
- `processed`: Si fue procesado exitosamente
- `transaction_id`: ID de la transacción creada
- `ai_interpretation`: JSON con la interpretación de la IA

## Funcionalidades Implementadas

### 1. Conexión de WhatsApp (`/whatsapp`)
- Los usuarios pueden conectar su número de WhatsApp
- Validación de formato de número
- Estado de conexión visible

### 2. Procesamiento Automático con IA
- Lovable AI (Gemini 2.5 Flash) interpreta los mensajes
- Extrae: tipo (ingreso/gasto), monto, descripción, categoría
- Sugiere categorías nuevas si es necesario
- Confirmación automática por WhatsApp

### 3. Análisis Financiero (`/analysis`)
- Dashboard completo con métricas
- Gráficas de gastos por categoría (Pie Chart)
- Proyecciones mensuales/anuales (Bar Chart)
- Análisis narrativo generado por IA
- Top 5 categorías de gasto

### 4. Dashboard Actualizado
- Banner de WhatsApp para conectar fácilmente
- Tarjeta de Análisis Financiero con acceso rápido
- Integración completa con el flujo existente

## Flujo Completo de Usuario

1. **Registro**: Usuario se registra en la app
2. **Conexión WhatsApp**: Usuario conecta su número en `/whatsapp`
3. **Envío de Transacciones**: Usuario envía mensajes naturales:
   - "Gasté $500 en comida"
   - "Ingreso de $2000 por trabajo"
4. **Procesamiento IA**: Sistema interpreta y categoriza
5. **Confirmación**: Usuario recibe confirmación por WhatsApp
6. **Análisis**: Usuario puede ver análisis detallado en `/analysis`

## Costos y Consideraciones

- **WhatsApp Business API**: Tiene costos por mensaje
- **Lovable AI**: Usa créditos según el uso (Gemini 2.5 es gratis hasta Oct 6, 2025)
- **Escalabilidad**: Sistema diseñado para escalar automáticamente

## Solución de Problemas

### Webhook no verifica
- Verifica que el token de verificación sea correcto
- Asegúrate de que la edge function esté desplegada
- Revisa los logs de la edge function

### Mensajes no se procesan
- Verifica que los secretos estén configurados
- Revisa que el usuario esté registrado y conectado
- Verifica los logs de las edge functions

### IA no interpreta correctamente
- Revisa el formato del mensaje
- Asegúrate de incluir monto y descripción
- Verifica que LOVABLE_API_KEY esté configurada

## Próximas Mejoras Sugeridas

1. **Comandos por WhatsApp**:
   - `/balance` - Ver balance actual
   - `/resumen` - Recibir análisis mensual

2. **Recordatorios Automáticos**:
   - Recordar registrar transacciones diarias
   - Alertas de gastos inusuales

3. **Reportes por WhatsApp**:
   - Envío automático de reportes semanales/mensuales
   - Gráficas por WhatsApp

4. **Transacciones Grupales**:
   - Dividir gastos entre varios usuarios
   - Grupos de WhatsApp para finanzas compartidas
