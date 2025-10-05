const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require('./keys/speedy-precept-441416-b4-1be89218efda.json');

const SHEET_ID = '1KrEK5a42KEdcs_Da7D33FqSniQtAIZVfk1dCrctmt5c';

async function agregarPedidoGoogleSheets(pedido) {
    const doc = new GoogleSpreadsheet(SHEET_ID);

    // Workaround para claves privadas con saltos de línea
    await doc.useServiceAccountAuth({
        client_email: creds.client_email,
        private_key: creds.private_key.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
        Fecha: pedido.fecha,
        Nombre: pedido.cliente.nombre,
        Direccion: pedido.cliente.direccion,
        Telefono: pedido.cliente.telefono,
        Pago: pedido.cliente.pago,
        Productos: Object.entries(pedido.productos).map(([c, p]) => `Color ${c}: ${p.cantidad}`).join('; '),
        Total: pedido.total
    });
}

module.exports = { agregarPedidoGoogleSheets };