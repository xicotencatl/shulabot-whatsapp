// index.js (versión mejorada con menús y fallback GPT)
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // necesario para Twilio

// Funciones de respuestas automatizadas
function mensajeBienvenida() {
  return `👋 Hola! Soy *Shulabot*, tu barista digital de *La Shula Café* ☕️🚲\n¿Qué te gustaría hacer hoy?\n1️⃣ Ver menú\n2️⃣ Ver promociones\n3️⃣ Hacer un pedido\n4️⃣ Saber dónde estamos\n5️⃣ Hablar con alguien del equipo`;
}

function mostrarMenu() {
  return `📜 *Nuestro menú del día:*\n1. Espresso - $30\n2. Capuchino - $40\n3. Latte Vainilla - $45\n4. Cold Brew - $45\n5. Horchata Latte - $50\n6. Frappe Frutos Rojos - $55\nEscribe el nombre o número para pedir o saber más.`;
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

// Endpoint de Webhook para Twilio + lógica condicional
app.post('/webhook', async (req, res) => {
  const userMessage = req.body.Body?.trim().toLowerCase();
  const from = req.body.From;

  console.log('📩 Mensaje recibido:', userMessage);

  const saludos = ['hola', 'hi', 'buenos días', 'buenas', 'holi'];

  if (saludos.some(s => userMessage.includes(s))) {

    const reply = mensajeBienvenida();
    res.set('Content-Type', 'text/xml');
    return res.send(`<Response><Message>${reply}</Message></Response>`);
  }

  // Fallback a GPT
  try {











    const gptReply = await usarGPT(userMessage);

    res.set('Content-Type', 'text/xml');
    return res.send(`<Response><Message>${gptReply}</Message></Response>`);

  } catch (err) {
    console.error('❌ Error generando respuesta GPT:', err.message);
    res.status(500).send(`<Response><Message>Lo siento, hubo un error procesando tu mensaje.</Message></Response>`);
  }
});


app.get('/', (req, res) => {
  res.send('✅ Shulabot está en línea. Usa POST a /webhook para interactuar.');
});

app.listen(3000, () => {
  console.log('Shulabot corriendo en puerto 3000');
});
