# 🚛 VREMP | Truck Spare Parts & Construction Equipment Rental

**VREMP** — A premium web platform for selling heavy truck spare parts (Actros, Scania, DAF, Howo) and renting construction equipment (excavators, cranes, loaders).

---

## 📂 Project Structure

```
vrempauto/
├── index.html      # Main website
├── style.css       # Dark luxury design system
├── script.js       # Cart, checkout, deals timers, support forms
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
