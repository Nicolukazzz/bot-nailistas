const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const JSONAdapter = require('@bot-whatsapp/database/json');
require('dotenv').config();

// Almacenamiento en memoria para usuarios atendidos
const usuariosAtendidos = new Set();
const fs = require('fs');
// Google Sheets setup

// Configuración del negocio
const CONFIG = {
    NOMBRE_NEGOCIO: "Nailistas",
    PRECIOS: {
        ESMALTE: 21000,
        TOP_COAT: 23000,
        BASE: 23000,
        BASE_RUBBER: 28000
    },
    COMBOS: {
        INICIAL: { precio: 85000, productos: { esmalte: 2, base: 1, top: 1 } },
        PROFESIONAL: { precio: 125000, productos: { esmalte: 3, base: 1, top: 1, rubber: 1 } },
        EMPRENDEDORA: { precio: 165000, productos: { esmalte: 4, base: 2, top: 2 } },
        RUBBER_PREMIUM: { precio: 155000, productos: { rubber: 2, esmalte: 2, base: 1, top: 1 } }
    },
    CARTA_URL: "https://drive.google.com/file/d/1rqeT8pZ7SoExgaptHw40F31QKMJCpzzk/view?usp=sharing",
    TELEFONO: "573XXXXXXX" // Tu número de WhatsApp
};

// Función para normalizar texto (quita tildes y pasa a minúsculas)
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// Middleware para verificar si el usuario ya fue atendido
const verificarUsuario = (ctx, { endFlow }) => {
    if (usuariosAtendidos.has(ctx.from)) {
        return endFlow(); // No responde más a este usuario
    }
};

// ===== FLUJOS DEL BOT ===== //

// Flujo principal de bienvenida
const flowPrincipal = addKeyword([
  'hola', 'menu', 'menú', 'inicio', 'empezar', 
  'comenzar', 'buenas', 'buen día', 
  'buenos días', 'buenas tardes', 'buenas noches'
])
  .addAction(verificarUsuario)

  // Mensaje de bienvenida
  .addAnswer([
    `🌸 ¡Hola! Bienvenid@ a *${CONFIG.NOMBRE_NEGOCIO}* 💅`,
    '¡Es un placer tenerte aquí! 😊'
  ])

.addAction(async (ctx, { provider }) => {
  const jid = ctx.key?.remoteJid || ctx.from;

  await provider.sendImage(jid, './media/com.png',);
  await provider.sendImage(jid, './media/Carta_1.png');
  await provider.sendImage(jid, './media/Carta_2.png');
})


  // Menú principal
  .addAnswer([
    '¿Qué te gustaría hacer?',
    '',
    '1️⃣ Ver *precios individuales*',
    '2️⃣ Ver *combos con descuento*',
    '3️⃣ Hacer un *pedido*',
    '4️⃣ Obtener *ayuda*',
    '5️⃣ Hablar con una *asesora*',
    '',
    'Responde con el número de la opción que prefieras 📱'
  ], { capture: true }, async (ctx, { flowDynamic, gotoFlow }) => {
    const opcion = normalizar(ctx.body.trim());

    switch (opcion) {
      case '1': return gotoFlow(flowPrecios);
      case '2': return gotoFlow(flowCombos);
      case '3': return gotoFlow(flowSolicitudPedido);
      case '4': return gotoFlow(flowAyuda);
      case '5': return gotoFlow(flowSoporte);
      default:
        if (normalizar(ctx.body).includes('menu')) {
          await flowDynamic([
            '¿Qué te gustaría hacer?',
            '',
            '1️⃣ Ver *precios individuales*',
            '2️⃣ Ver *combos con descuento*',
            '3️⃣ Hacer un *pedido*',
            '4️⃣ Obtener *ayuda*',
            '5️⃣ Hablar con una *asesora*',
            '',
            'Responde con el número de la opción que prefieras 📱'
          ]);
          return;
        }
        await flowDynamic('❌ Opción no válida. Por favor, elige 1, 2, 3, 4 o 5.');
        return gotoFlow(flowPrincipal);
    }
  });


// Flujo de precios individuales
const flowPrecios = addKeyword(['1', 'precios'])
    .addAction(verificarUsuario)
    .addAnswer([
        '💅 *PRECIOS INDIVIDUALES*',
        '',
        `📦 ESMALTES → $${CONFIG.PRECIOS.ESMALTE.toLocaleString()}`,
        `📦 TOP COAT → $${CONFIG.PRECIOS.TOP_COAT.toLocaleString()}`,
        `📦 BASE → $${CONFIG.PRECIOS.BASE.toLocaleString()}`,
        `📦 BASE RUBBER → $${CONFIG.PRECIOS.BASE_RUBBER.toLocaleString()}`,
        '',
        '🏠 Para volver al inicio escribe *menu*',
        '👩‍💼 Para hablar con asesora escribe *soporte*'
    ]);

// Flujo de combos
const flowCombos = addKeyword(['2', 'combos'])
    .addAction(verificarUsuario)
    .addAnswer([
        '✨ *COMBOS CON DESCUENTO*',
        '',
        '',
        '💅 COMBO INICIAL - $85.000',
        '✔ 2 esmaltes + 1 base + 1 top coat',
        '💲 Normal: $88.000 | 🔥 ¡Ahorras $3.000!',
        '',
        '',
        '🎨 COMBO PROFESIONAL - $125.000',
        '✔ 3 esmaltes + 1 base + 1 top + 1 base rubber',
        '💲 Normal: $135.000 | 🔥 ¡Ahorras $10.000!',
        '',
        '',
        '✨ COMBO EMPRENDEDORA - $165.000',
        '✔ 4 esmaltes + 2 bases + 2 tops',
        '💲 Normal: $176.000 | 🔥 ¡Ahorras $11.000!',
        '',
        '',
        '💎 COMBO RUBBER PREMIUM - $155.000',
        '✔ 2 base rubber + 2 esmaltes + 1 base + 1 top',
        '💲 Normal: $170.000 | 🔥 ¡Ahorras $15.000!',
        '',
        '',
        '🏠 Para volver al inicio escribe *menu*',
        '👩‍💼 Para hablar con asesora escribe *soporte*'
    ]);

// Flujo de ayuda MEJORADO con información esencial
const flowAyuda = addKeyword(['4', 'ayuda'])
    .addAction(verificarUsuario)
    .addAnswer([
        '💁‍♀️ *INFORMACIÓN IMPORTANTE* 💁‍♀️',
        '',
        '🚚 *ENTREGAS EN BOGOTÁ:*',
        '• Realizamos entregas en toda Bogotá',
        '• El costo de envío varía según la zona ($5.000 - $15.000)',
        '• Tiempo de entrega: 24-48 horas',
        '',
        '💵 *MEDIOS DE PAGO:*',
        '• Efectivo (contraentrega)',
        '• Transferencia Bancolombia',
        '• Nequi',
        '• Daviplata',
        '',
        '📦 *POLÍTICA DE ENTREGA:*',
        '• Pagas cuando recibes tu pedido',
        '• Revisa tu pedido al momento de la entrega',
        '• Productos con garantía de calidad',
        '',
        '👩‍💼 *¿Necesitas más ayuda?* Escribe *soporte* para hablar directamente conmigo',
        '🏠 Para volver al inicio escribe *menu*'
    ]);

// Flujo de solicitud de pedido
const flowSolicitudPedido = addKeyword(['3', 'pedido'])
    .addAction(verificarUsuario)
    .addAction(async (ctx, { flowDynamic }) => {
        const mensajeUnificado = [
            '🎨 *¡Perfecto! Quiero tomarte personalmente tu pedido* 💖',
            '',
            '📋 *Para agilizar el proceso, puedes enviarme:*',
            '• La cantidad de cada producto',
            '• Tu dirección aproximada (para cotizar envío)',
            '',
            `📞 *Me comunicaré contigo en menos de 1 hora*`,
            '',
            '💅 *¡Gracias por confiar en Nailistas!* 🌸'
        ].join('\n');

        await flowDynamic(mensajeUnificado);
        // Marcar como atendido - el bot no responderá más
        usuariosAtendidos.add(ctx.from);
    });

// Nuevo flujo para soporte directo
const flowSoporte = addKeyword(['5', 'soporte', 'asesora', 'asesor'])
    .addAction(verificarUsuario)
    .addAction(async (ctx, { flowDynamic }) => {
        const mensajeUnificado = [
            '👩‍💼 *¡Hola! Soy la asesora de Nailistas* 💖',
            '',
            '📞 *Me comunicaré contigo inmediatamente* para resolver todas tus dudas',
            '',
            'Puedes contarme:',
            '• Tus preguntas sobre productos',
            '• Dudas sobre pedidos',
            '• Solicitudes especiales',
            '• Quejas o sugerencias',
            '',
            '💅 *Estoy aquí para ayudarte personalmente* 🌸',
            '',
            '💬 Espera mi mensaje en el chat de WhatsApp...'
        ].join('\n');

        await flowDynamic(mensajeUnificado);
        // Marcar como atendido - el bot no responderá más
        usuariosAtendidos.add(ctx.from);
    });

// ===== INICIAR BOT ===== //
const main = async () => {
    const adapterDB = new JSONAdapter();
    const adapterFlow = createFlow([
        flowPrincipal,
        flowPrecios,
        flowCombos,
        flowAyuda,
        flowSolicitudPedido,
        flowSoporte
    ]);
    
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main().catch(console.error);