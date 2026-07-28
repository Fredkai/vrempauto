const express = require('express');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');
const dotenv = require('dotenv');
const paypal = require('@paypal/checkout-server-sdk');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const paypalClientId = process.env.PAYPAL_CLIENT_ID;
const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
const ordersFile = path.resolve(process.env.ORDERS_FILE || 'orders.json');

if (!stripeSecretKey || !paypalClientId || !paypalClientSecret) {
  console.warn('Missing payment configuration. Please add STRIPE_SECRET_KEY, PAYPAL_CLIENT_ID, and PAYPAL_CLIENT_SECRET to your .env file.');
}

const stripe = stripeSecretKey ? Stripe(stripeSecretKey) : null;
const paypalEnvironment = new paypal.core.SandboxEnvironment(paypalClientId || '', paypalClientSecret || '');
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

const ensureOrdersFile = () => {
  if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(ordersFile, '[]', 'utf8');
  }
};

const loadOrders = () => {
  ensureOrdersFile();
  try {
    return JSON.parse(fs.readFileSync(ordersFile, 'utf8')) || [];
  } catch (error) {
    console.error('Failed to load orders:', error);
    return [];
  }
};

const saveOrders = (orders) => {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2), 'utf8');
};

const persistOrder = (order) => {
  const orders = loadOrders();
  orders.push(order);
  saveOrders(orders);
  return order;
};

app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/webhook') {
      req.rawBody = buf;
    }
  },
}));

app.post('/api/checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured.' });
  }

  const { cart = [], success_url, cancel_url } = req.body;
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart must contain at least one item.' });
  }

  const line_items = cart.map(item => {
    const price = parseFloat((item.price || '').replace(/[^0-9.]/g, '')) || 0;
    return {
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(price * 100),
        product_data: {
          name: item.title || 'VREMP Part',
          description: item.category || '',
        },
      },
      quantity: 1,
    };
  });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      metadata: {
        cart: JSON.stringify(cart),
      },
      success_url: success_url || `${req.protocol}://${req.get('host')}/checkout-success.html`,
      cancel_url: cancel_url || `${req.protocol}://${req.get('host')}/checkout-cancel.html`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Unable to create Stripe checkout session.' });
  }
});

app.post('/api/paypal-order', async (req, res) => {
  if (!paypalClientId || !paypalClientSecret) {
    return res.status(500).json({ error: 'PayPal is not configured.' });
  }

  const { cart = [], return_url, cancel_url } = req.body;
  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: 'Cart must contain at least one item.' });
  }

  const items = cart.map(item => {
    const price = parseFloat((item.price || '').replace(/[^0-9.]/g, '')) || 0;
    return {
      name: item.title || 'VREMP Part',
      unit_amount: {
        currency_code: 'USD',
        value: price.toFixed(2),
      },
      quantity: '1',
      sku: item.sku || undefined,
    };
  });

  const total = items.reduce((sum, item) => sum + parseFloat(item.unit_amount.value), 0).toFixed(2);

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: total,
        breakdown: {
          item_total: {
            currency_code: 'USD',
            value: total,
          },
        },
      },
      items,
    }],
    application_context: {
      brand_name: 'VREMP',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: return_url || `${req.protocol}://${req.get('host')}/checkout-success.html`,
      cancel_url: cancel_url || `${req.protocol}://${req.get('host')}/checkout-cancel.html`,
    },
  });

  try {
    const order = await paypalClient.execute(request);
    const approveLink = order.result.links.find(link => link.rel === 'approve');
    res.json({ approveUrl: approveLink?.href || null });
  } catch (error) {
    console.error('PayPal error:', error);
    res.status(500).json({ error: 'Unable to create PayPal order.' });
  }
});

app.post('/api/paypal-capture', async (req, res) => {
  if (!paypalClientId || !paypalClientSecret) {
    return res.status(500).json({ error: 'PayPal is not configured.' });
  }

  const { orderID } = req.body;
  if (!orderID) {
    return res.status(400).json({ error: 'Missing PayPal order ID.' });
  }

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});
    const capture = await paypalClient.execute(request);
    const captureUnit = capture.result.purchase_units?.[0];
    const captureRecord = captureUnit?.payments?.captures?.[0];
    const payer = capture.result.payer || {};

    const order = {
      id: orderID,
      provider: 'paypal',
      status: capture.result.status,
      amount: captureRecord?.amount?.value || '0.00',
      currency: captureRecord?.amount?.currency_code || 'USD',
      payer: {
        name: `${payer.name?.given_name || ''} ${payer.name?.surname || ''}`.trim(),
        email: payer.email_address || '',
      },
      line_items: captureUnit?.items || [],
      created_at: new Date().toISOString(),
    };

    persistOrder(order);
    res.json({ success: true, order });
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ error: 'Unable to capture PayPal order.' });
  }
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripeWebhookSecret) {
    return res.status(400).json({ error: 'Stripe webhook secret is not configured.' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret);
  } catch (error) {
    console.error('Stripe webhook verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const sessionWithItems = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });
      const cart = sessionWithItems.metadata?.cart ? JSON.parse(sessionWithItems.metadata.cart) : [];
      const order = {
        id: session.id,
        provider: 'stripe',
        status: sessionWithItems.payment_status || session.payment_status,
        amount: sessionWithItems.amount_total ? (sessionWithItems.amount_total / 100).toFixed(2) : '0.00',
        currency: sessionWithItems.currency || 'usd',
        customer_email: sessionWithItems.customer_details?.email || session.customer_email || '',
        line_items: sessionWithItems.line_items?.data.map(item => ({
          name: item.description || item.price?.product?.name || 'VREMP Part',
          quantity: item.quantity,
          unit_amount: (item.price?.unit_amount || 0) / 100,
        })) || [],
        cart,
        created_at: new Date().toISOString(),
      };
      persistOrder(order);
    } catch (error) {
      console.error('Failed to persist Stripe order:', error);
    }
  }

  res.json({ received: true });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`VREMP backend running on http://localhost:${PORT}`);
});
