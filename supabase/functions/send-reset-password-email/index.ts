import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  token: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Reset password email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, redirectUrl }: ResetPasswordRequest = await req.json();
    
    console.log("Sending reset password email to:", email);

    // Construir el enlace de recuperación correcto con el formato de Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const resetLink = `${supabaseUrl}/auth/v1/verify?token=${token}&type=recovery&redirect_to=${redirectUrl}`;

    const emailResponse = await resend.emails.send({
      from: "Moni AI <onboarding@resend.dev>",
      to: [email],
      subject: "Restablece tu contraseña - Moni AI",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background-color: #f9fafb;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background: linear-gradient(to bottom, rgba(240, 249, 255, 0.5), white);
                border-radius: 24px;
                padding: 32px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
                border: 1px solid #dbeafe;
              }
              .logo {
                text-align: center;
                margin-bottom: 24px;
              }
              h1 {
                color: #111827;
                font-size: 24px;
                font-weight: bold;
                margin: 0 0 16px 0;
                text-align: center;
              }
              p {
                color: #4b5563;
                font-size: 14px;
                margin: 0 0 24px 0;
              }
              .button {
                display: inline-block;
                background: linear-gradient(to bottom, #374151, #111827);
                color: white;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 14px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transition: all 0.2s;
              }
              .button:hover {
                transform: scale(1.05);
                filter: brightness(1.05);
              }
              .button-container {
                text-align: center;
                margin: 32px 0;
              }
              .footer {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
              }
              .warning {
                background-color: #fef3c7;
                border: 1px solid #fbbf24;
                border-radius: 12px;
                padding: 16px;
                margin: 24px 0;
                font-size: 13px;
                color: #92400e;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <h1>🦉 Moni AI</h1>
              </div>
              
              <h1>¿Olvidaste tu contraseña?</h1>
              
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Moni AI.</p>
              
              <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
              
              <div class="button-container">
                <a href="${resetLink}" class="button">Restablecer Contraseña</a>
              </div>
              
              <div class="warning">
                ⚠️ Este enlace es válido por 1 hora. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
              </div>
              
              <p style="font-size: 13px; color: #6b7280;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
                <br>
                <span style="color: #3b82f6; word-break: break-all;">${resetLink}</span>
              </p>
              
              <div class="footer">
                <p>Este es un correo automático de Moni AI.</p>
                <p>© ${new Date().getFullYear()} Moni AI - Tu asistente financiero inteligente</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Reset password email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reset-password-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
