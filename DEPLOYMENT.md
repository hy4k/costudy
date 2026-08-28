# CoStudy Deployment & Git Guide

This guide outlines how to export the current codebase to Git/GitHub and deploy it to your **Hostinger VPS**.

---

## Part 1: How to Save / Export to Git & GitHub

In Google AI Studio:

1. **Export to GitHub directly**:
   - Click the **Settings (gear icon)** or the **Share/Export** menu in the top right corner of the AI Studio interface.
   - Choose **"Export to GitHub"** (or **"Export to ZIP"** if you prefer to upload manually).
   - Authorize your GitHub account and select/create a repository (e.g. `costudy-app`).
   - All current commits and files will be pushed to your repository.

2. **If downloading as ZIP & pushing from local terminal**:
   ```bash
   # Unzip the downloaded folder, navigate into it:
   cd costudy-app

   # Initialize git repository
   git init
   git add .
   git commit -m "Initial commit - CoStudy Platform"

   # Link to your remote GitHub repository
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

---

## Part 2: Deploying to Hostinger VPS

### Prerequisites on Hostinger VPS
1. SSH into your Hostinger VPS:
   ```bash
   ssh root@YOUR_VPS_IP
   ```
2. Update packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

### Option A: Deploy with Docker (Recommended - Clean & Fast)

1. **Install Docker & Docker Compose on your VPS**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   sudo apt install -y docker-compose-plugin
   ```

2. **Clone your Git repository onto the VPS**:
   ```bash
   cd /var/www || cd ~
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git costudy
   cd costudy
   ```

3. **Configure Environment Variables**:
   Create a `.env` file:
   ```bash
   nano .env
   ```
   Add your variables:
   ```env
   VITE_SUPABASE_URL=https://avtjxcdcjbwmggdimkgh.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   Save with `Ctrl + O`, then `Enter`, then exit with `Ctrl + X`.

4. **Build and Run the Container**:
   ```bash
   docker compose up -d --build
   ```
   Your app is now live on `http://YOUR_VPS_IP`!

---

### Option B: Deploy with Native Nginx & Node.js

1. **Install Node.js & Nginx on VPS**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs nginx git
   ```

2. **Clone and Build the App**:
   ```bash
   cd /var/www
   sudo git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git costudy
   cd costudy

   # Create .env file with your credentials
   sudo nano .env
   # (Paste VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY)

   # Install dependencies and build
   sudo npm install
   sudo npm run build
   ```

3. **Configure Nginx Site**:
   ```bash
   sudo nano /etc/nginx/sites-available/costudy
   ```
   Paste the following configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com YOUR_VPS_IP;

       root /var/www/costudy/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
           expires 6M;
           access_log off;
           add_header Cache-Control "public, max-age=15552000, immutable";
       }
   }
   ```

4. **Enable Site & Restart Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/costudy /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Part 3: Free SSL Certificate (HTTPS)

If you have pointed your domain name (e.g. `yourdomain.com`) to your Hostinger VPS IP address:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot will configure SSL automatically with auto-renewal enabled!
