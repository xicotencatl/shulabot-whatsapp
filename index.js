// index.js - Shulabot versión completa con menús y fallback GPT

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // necesario para Twilio

// 🟢 Funciones automáticas de respuesta
function mensajeBienvenida() {
  return `👋 Hola! Soy *Shulabot*, tu barista digital de *La Shula Café* ☕️🚲\n¿Qué te gustaría hacer hoy?\n1️⃣ Ver menú\n2️⃣ Ver promociones\n3️⃣ Hacer un pedido\n4️⃣ Saber dónde estamos\n5️⃣ Hablar con alguien del equipo`;
}

function mostrarMenu() {
  return `📜 *Nuestro menú del día:*\n1. Espresso - $30\n2. Capuchino - $40\n3. Latte Vainilla - $45\n4. Cold Brew - $45\n5. Horchata Latte - $50\n6. Frappe Frutos Rojos - $55\n\nEscribe el nombre o número para pedir o saber más.`;
}

function mostrarPromos() {
  return `🎉 *Promos activas:*\n- 2x1 en Cold Brew (hasta 10 AM con ropa deportiva)\n- Frappe + Empanada de zarzamora $75\n*Válido mostrando este mensaje.*`;
}

function mandarUbicacion() {
  return `📍 *Ubicación:* Avenida San Isidro, frente a Arboledas\n🕒 *Horario:* L-V 7-10:30AM / Sáb 8-11AM`;
}

function mensajeContacto() {
  return `✉️ Puedes hablar con alguien del equipo respondiendo *Hablar* o acércate directamente al carrito. ☕️`;
}

// 🧠 Fallback GPT
async function usarGPT(mensaje) {
  const prompt = `Actúa como Shulabot, un barista experto en café de especialidad. Responde como si fueras parte de La Shula Café, un carrito de café en Metepec. Usa un tono amistoso, profesional y breve. El cliente pregunta: ${mensaje}`;

  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'openai/gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }]
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content;
}

// 🔁 Webhook de Twilio
app.post('/webhook', async (req, res) => {
  const userMessage = req.body.Body?.trim().toLowerCase();
  const from = req.body.From;
  let reply;

  // 🔤 Opciones con palabras clave
  const saludos = ['hola', 'hi', 'buenos días', 'buenas'];
  const opcionMenu = ['1', 'ver menú', 'menu'];
  const opcionPromos = ['2', 'ver promociones', 'promos', 'promociones'];
  const opcionPedido = ['3', 'hacer un pedido', 'pedido', 'ordenar'];
  const opcionUbicacion = ['4', 'ubicación', 'dónde están', 'donde están'];
  const opcionContacto = ['5', 'hablar con alguien', 'contacto', 'hablar'];

  try {
    if (saludos.some(s => userMessage.includes(s))) {
      reply = mensajeBienvenida();
    } else if (opcionMenu.some(o => userMessage.includes(o))) {
      reply = mostrarMenu();
    } else if (opcionPromos.some(o => userMessage.includes(o))) {
      reply = mostrarPromos();
    } else if (opcionPedido.some(o => userMessage.includes(o))) {
      reply = `📝 Para hacer tu pedido, por favor escribe el nombre exacto de la bebida o número de menú.\nEjemplo: *Cold Brew* o *4*`;
    } else if (opcionUbicacion.some(o => userMessage.includes(o))) {
      reply = mandarUbicacion();
    } else if (opcionContacto.some(o => userMessage.includes(o))) {
      reply = mensajeContacto();
    } else {
      // Si no coincide nada: usar GPT como fallback
      reply = await usarGPT(userMessage);
    }

    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>${reply}</Message></Response>`);

  } catch (error) {
    console.error('❌ Error en webhook:', error.message);
    res.status(500).send(`<Response><Message>Hubo un problema procesando tu mensaje. Intenta más tarde.</Message></Response>`);
  }
});

// 🟢 Ruta para prueba rápida
app.get('/', (req, res) => {
  res.send('✅ Shulabot está en línea. Usa POST a /webhook para interactuar.');
});

// 🟢 Escuchar puerto
app.listen(3000, () => {
  console.log('Shulabot corriendo en puerto 3000');
});
