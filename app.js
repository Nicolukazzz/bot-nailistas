const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const JSONAdapter = require('@bot-whatsapp/database/json');
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
require('dotenv').config();

// Almacenamiento en memoria para usuarios atendidos
const usuariosAtendidos = new Set();
const usuariosConBienvenida = new Set();

// Configuración del evento
const CONFIG_EVENTO = {
    NOMBRE_EVENTO: "Evento Demostrativo Nailistas",
    FECHA: "26 de octubre",
    HORARIO: "9:00 a.m. - 4:00 p.m.",
    LUGAR: "Calle 8 #20-30, C.C. 7 Mares, Piso 7",
    COSTO: 30000,
    NUMERO_NEQUI: "3245082321",
    NOMBRE_NEQUI: "Heidy Galindo"
};

// Función para normalizar texto
function normalizar(texto) {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// Función para extraer el primer número del mensaje
function extraerOpcion(mensaje) {
    if (!mensaje) return null;
    const numeros = mensaje.match(/\d/);
    return numeros ? numeros[0] : null;
}

// Menú constante - siempre el mismo
function mostrarMenu() {
    return [
        '',
        '📋 *Opciones disponibles:*',
        '',
        '1️⃣ *Información completa*',
        '2️⃣ *Instrucciones de pago*', 
        '3️⃣ *Hablar con una asesora*',
        '0️⃣ *Volver al inicio*',
        '',
        '💡 *Escribe el número de la opción que deseas*'
    ].join('\n');
}

// Generadores de mensajes
function generarMensajeInformacion() {
    return [
        `✨💅 *${CONFIG_EVENTO.NOMBRE_EVENTO}* 💅✨`,
        '',
        '📅 *Fecha:* 26 de octubre',
        '⏰ *Horario:* 9:00 a.m. - 4:00 p.m.',
        `📍 *Lugar:* ${CONFIG_EVENTO.LUGAR}`,
        '',
        '🗺️ *Ubicación en Google Maps:*',
        'https://www.google.com/maps?q=4.603778,-74.089302',
        '',
        '💵 *Inversión:* $30.000',
        '🎁 *Incluye kit exclusivo:*',
        '   • Dúo de Top Coat',
        '   • 3 glitters espectaculares encapsulados',
        '',
        '🌟 *Actividades destacadas:*',
        '   • Charla financiera con experto',
        '   • Demostración en vivo de manicura',
        '   • Rifas y regalos sorpresa',
        '   • Espacio para compartir experiencias',
        '',
        '🗓️ *Agenda del día:*',
        '1. *Charla financiera* a cargo de Oscar Iván Quebelleza',
        '2. *Demostración en vivo* de manicura por Erika',
        '3. *Rifas y regalos* durante todo el evento',
        '',
        '¡Será un día inolvidable! ✨'
    ].join('\n');
}

function generarMensajePago() {
    return [
        '💰 *INSTRUCCIONES DE PAGO* 💰',
        '',
        '🎉 *¡PERFECTO!* Para registrar tu cupo sigue estos pasos:',
        '',
        '1. *Realiza el pago* por Nequi:',
        `   📲 *Número:* ${CONFIG_EVENTO.NUMERO_NEQUI}`,
        `   👤 *A nombre de:* ${CONFIG_EVENTO.NOMBRE_NEQUI}`,
        `   💰 *Monto:* $${CONFIG_EVENTO.COSTO.toLocaleString()}`,
        '',
        '2. *Toma captura de pantalla* del comprobante',
        '',
        '3. *Envía la captura* por este chat a la asesora',
        '',
        '🎁 *Tu participación incluye:*',
        '   • Ingreso al evento',
        '   • Kit exclusivo con Top Coat + 3 glitters espectaculares',
        '',
        '📸 *¡Listo! Envía tu comprobante cuando realices el pago*',
        '',
        '💡 *Asegúrate de que en el comprobante se vea:*',
        '• Nombre de quien envía',
        '• Número de teléfono', 
        '• Fecha del pago'
    ].join('\n');
}

function generarMensajeAsesora() {
    return [
        '👩‍💼 *¡Hola! Soy la asesora de Nailistas* 💅✨',
        '',
        '✨ *Estoy aquí para resolver todas tus dudas sobre el evento:*',
        '',
        '• Proceso de pago y confirmación',
        '• Información detallada del evento', 
        '• Ubicación y cómo llegar',
        '• Recepción de comprobantes',
        '• Cualquier otra pregunta que tengas',
        '',
        '📞 *Me comunicaré contigo en los próximos minutos*',
        '',
        '💬 *Puedes enviarme directamente:*',
        '- Tu comprobante de pago',
        '- Tus preguntas específicas',
        '- Dudas sobre el evento',
        '',
        '¡Será un gusto atenderte! 💖',
        '',
        '✅ *Has sido marcado como atendido*'
    ].join('\n');
}

// ===== FUNCIÓN PARA PROCESAR OPCIONES ===== //
async function procesarOpcion(ctx, flowDynamic, endFlow, gotoFlow) {
    try {
        const mensaje = ctx.body ? ctx.body.trim() : '';
        const opcion = extraerOpcion(mensaje);
        const textoNormalizado = normalizar(mensaje);
        
        console.log(`📱 Usuario: "${mensaje}" - Opción: ${opcion}`);

        // Procesar opción numérica
        if (opcion) {
            switch (opcion) {
                case '0':
                    await flowDynamic('🔄 Volviendo al menú principal...');
                    return gotoFlow(flowPrincipal);
                case '1':
                    await flowDynamic(generarMensajeInformacion());
                    return;
                case '2':
                    await flowDynamic(generarMensajePago());
                    return;
                case '3':
                    await flowDynamic(generarMensajeAsesora());
                    usuariosAtendidos.add(ctx.from);
                    console.log(`✅ Usuario ${ctx.from} marcado como atendido`);
                    return endFlow();
                default:
                    await flowDynamic('❌ Opción no válida. Por favor elige una opción del 0 al 3:');
                    await flowDynamic(mostrarMenu());
                    return;
            }
        }

        // Procesar texto
        if (textoNormalizado.includes('informacion') || textoNormalizado.includes('info')) {
            await flowDynamic(generarMensajeInformacion());
            await flowDynamic(mostrarMenu());
            return;
        } else if (textoNormalizado.includes('pago') || textoNormalizado.includes('pagar') || textoNormalizado.includes('comprobante')) {
            await flowDynamic(generarMensajePago());
            await flowDynamic(mostrarMenu());
            return;
        } else if (textoNormalizado.includes('asesora') || textoNormalizado.includes('soporte') || textoNormalizado.includes('hablar')) {
            await flowDynamic(generarMensajeAsesora());
            usuariosAtendidos.add(ctx.from);
            console.log(`✅ Usuario ${ctx.from} marcado como atendido por texto`);
            return endFlow();
        } else if (textoNormalizado.includes('menu') || textoNormalizado.includes('volver') || textoNormalizado.includes('regresar') || textoNormalizado.includes('inicio')) {
            await flowDynamic('🔄 Volviendo al menú principal...');
            return gotoFlow(flowPrincipal);
        } else {
            await flowDynamic('❌ No entendí tu respuesta. Por favor elige una opción:');
            await flowDynamic(mostrarMenu());
            return;
        }
    } catch (error) {
        console.error('Error en procesarOpcion:', error);
        await flowDynamic('⚠️ Ocurrió un error. Por favor intenta de nuevo.');
        await flowDynamic(mostrarMenu());
    }
}

// ===== FLUJO DE BIENVENIDA ===== //
const flowBienvenida = addKeyword([
    'hola', 'holi', 'hello', 'hi', 'buenas', 
    'evento', 'nailistas', '26 de octubre', 'octubre',
    'información', 'info', 'quiero información', 
    'buen día', 'buenos días', 'buenas tardes', 'buenas noches', 'quiero asistir', 'quiero ir', 'quiero participar', 'me interesa', 'interesada', 'interesado', 'Buenas', 'Buenas tardes', 'Buenas noches', 'Buenas dias', 'buenas dias', 'buenas noches', 'buenas tardes', 'buenas noches', 'buenas dias', 'buenas tardes', 'buenas noches'
])
.addAction(async (ctx, { endFlow }) => {
    try {
        if (usuariosAtendidos.has(ctx.from)) {
            console.log(`🔕 Usuario ${ctx.from} ya atendido, ignorando mensaje`);
            return endFlow();
        }
        
        if (!usuariosConBienvenida.has(ctx.from)) {
            usuariosConBienvenida.add(ctx.from);
            console.log(`👋 Nueva conversación con usuario ${ctx.from}`);
        }
    } catch (error) {
        console.error('Error en addAction:', error);
    }
})
.addAnswer(
    `✨💅 ¡Bienvenida al *${CONFIG_EVENTO.NOMBRE_EVENTO}*! 💅✨

¡Hola! 💖

Nos emociona saber que estás interesada en nuestro evento especial del *26 de octubre*. 🎉

Este evento es una *experiencia única* donde la creatividad y la pasión por el mundo de las uñas se unen.`
)
.addAnswer(
    mostrarMenu(),
    { capture: true }, 
    async (ctx, { flowDynamic, endFlow, gotoFlow }) => {
        await procesarOpcion(ctx, flowDynamic, endFlow, gotoFlow);
    }
);

// ===== FLUJO PRINCIPAL (sin bienvenida) ===== //
const flowPrincipal = addKeyword(['1', '2', '3', '0', 'menu', 'menú', 'volver', 'regresar', 'inicio'])
.addAction(async (ctx, { endFlow }) => {
    try {
        if (usuariosAtendidos.has(ctx.from)) {
            console.log(`🔕 Usuario ${ctx.from} ya atendido, ignorando mensaje`);
            return endFlow();
        }
    } catch (error) {
        console.error('Error en addAction:', error);
    }
})
.addAnswer(
    mostrarMenu(),
    { capture: true }, 
    async (ctx, { flowDynamic, endFlow, gotoFlow }) => {
        await procesarOpcion(ctx, flowDynamic, endFlow, gotoFlow);
    }
);

// ===== INICIAR BOT ===== //
const main = async () => {
    try {
        const adapterDB = new JSONAdapter(); // Cambia a PostgresAdapter si configuras DB
        const adapterFlow = createFlow([flowBienvenida, flowPrincipal]);
        
        const adapterProvider = createProvider(BaileysProvider, {
            connectOptions: {
                logger: pino({ level: 'warn' }),
                printQRInTerminal: true,
                generateHighQualityLink: true,
                qrTimeout: 60000,
                keepAliveIntervalMs: 30000,
                auth: useMultiFileAuthState('./auth_info_baileys')
            },
            onError: (error) => {
                console.error('Error en provider:', error);
                if (error.message && (error.message.includes('Bad MAC') || error.message.includes('decrypt'))) {
                    console.log('🔄 Error de sesión detectado. Reinicia el bot para resincronizar.');
                }
            }
        });

        const bot = await createBot({
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        });

        // Fallback para mensajes fallidos (ej. desencriptación) - Accede via provider.sock.ev
        if (adapterProvider.sock && adapterProvider.sock.ev) {
            adapterProvider.sock.ev.on('messages.upsert', (m) => {
                try {
                    const msg = m.messages[0];
                    if (msg && msg.messageStubType) {
                        console.log(`⚠️ Stub ignorado: ${msg.messageStubType} de ${msg.key.remoteJid}`);
                        return;
                    }
                    if (m.error) {
                        console.log(`⚠️ Mensaje fallido de ${m.key?.remoteJid}: ${m.error.message}`);
                    }
                } catch (err) {
                    console.error('Error en messages.upsert:', err);
                }
            });
        } else {
            console.log('⚠️ Provider sock no disponible para fallback events');
        }

        await QRPortalWeb();

        console.log('🤖 Bot del Evento Nailistas - ESTABLE CON BAILEYS 6.5.0');
        console.log('🎯 4 opciones: 1=Info, 2=Pago, 3=Asesora, 0=Inicio');
        console.log('🔢 Menú único - Sin repeticiones');
        console.log('✅ Opción 3 marca como atendido automáticamente');
        console.log('🛡️ Manejo de Bad MAC y dependencias unificadas');
        
    } catch (error) {
        console.error('Error al iniciar el bot:', error);
        process.exit(1);
    }
};

main().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
});