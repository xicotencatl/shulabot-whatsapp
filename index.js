// index.js – Shulabot versión GPT-3.5 Turbo
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Necesario para Twilio

// 🟩 Funciones automáticas con respuestas prediseñadas
function mensajeBienvenida() {
  return `👋 ¡Hola! Soy *Shulabot*, tu barista digital de *La Shula Café* ☕️🚲\n¿Qué te gustaría hacer hoy?\n1️⃣ Ver menú\n2️⃣ Ver promociones\n3️⃣ Hacer un pedido\n4️⃣ Saber dónde estamos\n5️⃣ Hablar con el equipo`;
}

function mostrarMenu() {
  return `📜 *Nuestro menú del día:*\n1. Espresso - $30\n2. Capuchino - $40\n3. Latte Vainilla - $45\n4. Cold Brew - $45\n5. Horchata Latte - $50\n6. Frappe Frutos Rojos - $55\n\nEscribe el nombre o número para pedir o saber más.`;
}

function mostrarPromos() {
  return `🎉 *Promos activas:*\n- 2x1 en Cold Brew (hasta 10 AM con ropa deportiva)\n- Frappe + Empanada de zarzamora $75\n*Solo mostrando este mensaje* ✅`;
}

function mandarUbicacion() {
  return `📍 *Ubicación:* Avenida San Isidro, frente a Arboledas\n🕒 *Horario:* L-V 7:00 - 10:30 AM | Sáb 8:00 - 11:00 AM`;
}

function mensajeContacto() {
  return `✉️ Puedes hablar con el equipo escribiendo *Hablar* o acércate directo al carrito. ¡Te esperamos!`;
}

// 🧠 Fallback con GPT-3.5 Turbo usando un prompt empresarial
async function usarGPT(mensaje) {
  const promptSistema = `
Eres *Shulabot*, el asistente barista digital de *La Shula Café*, una cafetería móvil de especialidad en Metepec. 
Tu personalidad es amigable, profesional y concisa. Respondes solo sobre productos, promociones, ubicación, horarios y dudas relacionadas al café de especialidad y el negocio. 
Nunca inventas información ni respondes fuera del contexto del negocio. Si algo no lo sabes, invita al cliente a hablar con el equipo humano. 
Siempre hablas en tono cálido, usas emojis moderadamente, y fomentas la comunidad de café.
`;

  console.log('🔑 Key detectada:', process.env.OPENAI_API_KEY ? '✅ Sí' : '❌ No');

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: promptSistema },
        { role: 'user', content: mensaje }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.choices[0].message.content;
}

// 🔁 Webhook principal conectado con Twilio
app.post('/webhook', async (req, res) => {
  const userMessage = req.body.Body?.trim().toLowerCase();
  let reply = '';

  // 🔤 Palabras clave y opciones del menú
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
      reply = `📝 Para hacer tu pedido, escribe el nombre exacto del producto o su número.\nEjemplo: *Cold Brew* o *4*`;
    } else if (opcionUbicacion.some(o => userMessage.includes(o))) {
      reply = mandarUbicacion();
    } else if (opcionContacto.some(o => userMessage.includes(o))) {
      reply = mensajeContacto();
    } else {
      reply = await usarGPT(userMessage); // Fallback GPT-3.5
    }

    res.set('Content-Type', 'text/xml');
    res.send(`<Response><Message>${reply}</Message></Response>`);
  } catch (error) {
    console.error('❌ Error GPT:', error.message);
    res.status(500).send(`<Response><Message>Lo siento, algo falló. Intenta más tarde.</Message></Response>`);
  }
});

// 🟢 Verificación de que está corriendo
app.get('/', (req, res) => {
  res.send('✅ Shulabot está en línea. Usa POST a /webhook para interactuar.');
});

// 🧪 Endpoint para verificar si la OPENAI_API_KEY fue detectada
app.get('/debug-key', (req, res) => {
  if (process.env.OPENAI_API_KEY) {
    res.send('🔑 Key detectada: ✅ Sí');
  } else {
    res.send('🔑 Key detectada: ❌ No');
  }
});

app.listen(3000, () => {
  console.log('Shulabot corriendo en puerto 3000 🚀');
});
