# 🚛 VREMP | Truck Spare Parts & Construction Equipment Rental

**VREMP** — A premium web platform for selling heavy truck spare parts (Actros, Scania, DAF, Howo) and renting construction equipment (excavators, cranes, loaders).

---

## 📂 Project Structure

```
vrempauto/
├── index.html      # Main website
├── style.css       # Dark luxury design system
├── script.js       # Cart, checkout, deals timers, support forms
├── catalog.json    # Consolidated product & rental data catalog dictionary
├── nginx.conf      # Production Nginx config (Google Cloud VM)
├── assets/         # Product images
│   ├── car-1.png
│   ├── car-2.png
│   ├── car-3.png
│   ├── car-4.png
│   ├── car-5.png
│   └── part-1.png
├── README.md
└── .gitignore
```

---

## 🌐 Google Cloud VM Details
*   **Instance Name:** `vremp-server`
*   **Zone:** `us-east1-b` (South Carolina)
*   **Machine Type:** `e2-micro` (Google Cloud Free Tier)
*   **OS:** Ubuntu 22.04 LTS
*   **Internal IP:** `10.142.0.2`
*   **External IP:** `35.231.224.50`
*   **Domain:** [vrempauto.com](https://vrempauto.com) & [www.vrempauto.com](https://www.vrempauto.com)

---

## 🛠️ Setup & Deployment Steps Completed

### 1. VM Provisioning & Firewall Rules
Created a free-tier Ubuntu instance in GCP and allowed inbound traffic on HTTP (80) and HTTPS (443) via a VPC firewall rule.

### 2. Website Upload & Extraction
Compressed the folder locally into `vrempauto.zip`, uploaded it using Google Cloud Shell, and transferred it to the VM:
```bash
gcloud compute scp ~/vrempauto.zip vremp-server:~ --zone=us-east1-b
```
Extracted the website into `/var/www/vremp` and configured the Nginx server block.

### 3. DNS Configuration (Hostinger)
Updated DNS A-records in Hostinger:
*   `@` pointing to `35.231.224.50`
*   `www` pointing to `35.231.224.50`

### 4. SSL/HTTPS Configuration
Installed Certbot and python3-nginx plugin to automatically request and apply Let's Encrypt certificates:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d vrempauto.com -d www.vrempauto.com
```

---

## ⚡ How to Make Fast Updates (Git Workflow)

Since outbound SSH port 22 is blocked on your local network, the fastest way to edit and deploy updates (like logos or content) is using **GitHub**.

### 1. One-time Setup on Local Computer
Initialize a Git repository in your project folder, link it to a private GitHub repository, and push:
```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### 2. One-time Setup on your Google Cloud VM
Log into your VM via Cloud Shell and clone the repository directly into the `/var/www/vremp` folder:
```bash
sudo rm -rf /var/www/vremp
sudo git clone <YOUR_GITHUB_REPO_URL> /var/www/vremp
sudo chown -R www-data:www-data /var/www/vremp
```

### 3. The Fast Update Workflow
Whenever you make a change (like updating the logo, HTML, or CSS):
1. **Commit and Push locally:**
   ```powershell
   git add .
   git commit -m "Updated logo"
   git push origin main
   ```
2. **Pull the changes on the VM:**
   SSH into your VM and run:
   ```bash
   cd /var/www/vremp
   sudo git pull
   ```
*This pulls changes instantly in 2 seconds without having to upload zip files again!*
---

## 💳 Payment Gateway Integration
This project now includes a backend-ready checkout flow for Stripe and PayPal.

### What was added
- `server.js` — Express backend that creates Stripe checkout sessions and PayPal orders.
- `package.json` — Node dependencies for `express`, `stripe`, `dotenv`, and `@paypal/checkout-server-sdk`.
- `.env.example` — environment config template for secrets.
- `checkout-success.html` — payment success page.
- `checkout-cancel.html` — payment cancellation page.

### How to install backend dependencies
From the project root:
```bash
npm install
```

### How to configure payment keys
Copy `.env.example` to `.env` and set your secret values:
```bash
cp .env.example .env
```

Then add:
```text
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PORT=3000
ORDERS_FILE=orders.json
```

### How to run locally
```bash
npm start
```

---

## 📁 Project Architecture

This project is intentionally split into two parts:

1. **Frontend** - Static website + UI behavior
2. **Backend** - Payment API server

### Frontend files
- `index.html` — the main website markup, navigation, homepage, search, product grid, modal, cart drawer, contact form.
- `style.css` — all visual styling, layout rules, responsive grid behavior, and animated UI states.
- `script.js` — site logic for:
  - loading product data from `products.json`
  - rendering the product grid dynamically
  - filtering products by search, category, or vehicle selection
  - managing the cart state in memory
  - opening and closing product detail modal
  - handling EmailJS quote requests and contact form submissions
  - sending checkout requests to the backend
- `products.json` — catalog data in JSON format used by the frontend. This makes adding or changing products much easier.
- `assets/` — static images used by product cards and the site design.

### Backend files
- `server.js` — Node/Express application that provides payment endpoints only.
- `package.json` — backend dependencies and startup script.
- `.env.example` — template for secret API keys.
- `orders.json` — local order persistence file created at runtime. It is ignored by Git.
- `checkout-success.html` and `checkout-cancel.html` — user-facing redirect pages after payment.

---

## 🔧 How the technical flow works

### Startup flow
1. Start a local HTTP server for the frontend, for example:
   ```powershell
   python -m http.server 8080
   ```
2. Start the backend from the same project folder:
   ```powershell
   npm start
   ```
3. Open the frontend in your browser:
   - `http://127.0.0.1:8080`

### Frontend flow
1. `index.html` loads in the browser and includes `script.js`.
2. `script.js` fetches `products.json` and renders the shop grid inside `.shop-grid`.
3. The search input, category selector, and vehicle filters update the displayed products without reloading the page.
4. Clicking a product card opens the detail modal. Clicking `Add to Inquiry` adds that item to the cart.
5. The cart drawer shows selected items and a total price.
6. The cart has three actions:
   - `Pay with Card` → sends cart data to backend `/api/checkout-session`
   - `Pay with PayPal` → sends cart data to backend `/api/paypal-order`
   - `Request Quote by Email` → sends a quote request through EmailJS or falls back to `mailto:`.

### Backend flow
1. The backend listens on `PORT` from `.env` or defaults to `3000`.
2. The frontend calls backend endpoints when checkout is requested.
3. `server.js` builds a Stripe checkout session or PayPal order and returns the payment URL.
4. The frontend redirects the browser to the payment provider.
5. After payment, the user is sent to `checkout-success.html` or `checkout-cancel.html`.

### Why `http://localhost:8080` and `http://localhost:3000` are both needed
- The frontend is static and served by a simple web server.
- The backend is a separate Node API server for payments only.
- Because the frontend currently uses relative API paths like `/api/checkout-session`, the simplest local test is to make backend requests from the same browser origin or adjust the backend URL in `script.js`.

---

## 🧠 Important notes for local testing

### If frontend is on `8080` and backend is on `3000`
Your browser will make the checkout request from `8080`, but the backend is on `3000`. This is a cross-origin setup and may require updating the API URL in `script.js` or using a proxy.

### Recommended local run for current code
Use the same origin for both by running a local frontend server and a backend server, then adjusting the frontend API base URL if needed.

### Example API endpoint URL for backend
If the backend is on port `3001`, the frontend should call:
```js
const apiBase = 'http://127.0.0.1:3001';
```
Then the requests become:
```js
await fetch(`${apiBase}/api/checkout-session`, ...)
await fetch(`${apiBase}/api/paypal-order`, ...)
```

---

## ✅ Why this structure was chosen

- Keeps the website fast and static for normal browsing.
- Keeps payment secrets and logic out of browser code.
- Makes product catalog edits simpler by using `products.json`.
- Makes it easier to add a real backend later without changing the whole frontend.

If you want, I can also add a small “Developer Quickstart” section with exact commands and what each terminal should show. 
### Order persistence
- `orders.json` stores captured Stripe/PayPal order records.
- The file is excluded from Git via `.gitignore`.

### Nginx proxy configuration
The site already includes an API proxy in `nginx.conf`:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### Notes
- Stripe uses `checkout-session` for card payments.
- PayPal uses `paypal-order` for browser checkout approval.
- Frontend buttons are wired in `script.js` and still preserve the existing quote request fallback.