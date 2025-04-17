const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Necesario para datos x-www-form-urlencoded de Twilio

// Ruta para interactuar desde Postman o sistemas externos
app.post('/shulabot', async (req, res) => {
  const userMessage = req.body.message;

  const prompt = `Actúa como Shulabot, un barista experto en café. Cliente dice: "${userMessage}"`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Error al generar respuesta' });
  }
});

// Ruta para mensajes entrantes desde WhatsApp vía Twilio
app.post('/webhook', async (req, res) => {
  console.log('🔔 Webhook recibido:', req.body); // Log de depuración

  const userMessage = req.body.Body;
  const from = req.body.From;

  const prompt = `Actúa como Shulabot, un barista experto en café. Cliente dice: "${userMessage}"`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.choices[0].message.content;

    // Devolver XML como Twilio espera
    res.set('Content-Type', 'text/xml');
    res.send(`
<Response>
  <Message>${reply}</Message>
</Response>
    `);

  } catch (error) {
    console.error('❌ Error generando respuesta:', error.response?.data || error.message);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta raíz para pruebas básicas
app.get('/', (req, res) => {
  res.send('✅ Shulabot está en línea. Usa POST a /shulabot o /webhook para interactuar.');
});

app.listen(3000, () => {
  console.log('🟢 Shulabot corriendo en puerto 3000 wuahuuu');
});
