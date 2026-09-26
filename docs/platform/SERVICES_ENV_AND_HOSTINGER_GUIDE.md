# Madni Education Trust - Services, Environment Keys & Hostinger VPS Purchase Guide

---

## 🔐 Master Account Credentials

All third-party services and platforms use the unified organization account credentials:

- **Primary Admin Email**: `admin@madnieducation.org`
- **Primary Password**: `AQwIKwVowlls1Lrs`
- **Hostinger Account Password**: `pwPN6xR(5F)pg',z`
- **Madni Database Password**: `isff@gEtqZJ9fjK`

---

## 🗄️ Neon PostgreSQL Database Details

- **Direct Connection String**: `postgresql://neondb_owner:npg_Ede9Ma3WJDzf@ep-blue-bar-aygmgq0p.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require`
- **Pooler Connection String**: `postgresql://neondb_owner:npg_Ede9Ma3WJDzf@ep-blue-bar-aygmgq0p-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Host**: `ep-blue-bar-aygmgq0p.c-5.us-east-2.aws.neon.tech`
- **Pooler Host**: `ep-blue-bar-aygmgq0p-pooler.c-5.us-east-2.aws.neon.tech`
- **Database Name**: `neondb`
- **Role / User**: `neondb_owner`
- **DB Key / Password**: `npg_Ede9Ma3WJDzf` / `isff@gEtqZJ9fjK`

---

## 🌐 1. Third-Party Services Overview

Below is the list of all external services integrated into the Madni Education Trust platform, their purpose, and platform access links:

| Service Name | Category | Purpose in Project | Official Website Link |
| :--- | :--- | :--- | :--- |
| **Neon PostgreSQL** | Database | Serverless PostgreSQL cloud database storing users, schools, alumni, donations, and transactions. | [neon.tech](https://neon.tech) |
| **Firebase** | Push Notifications & Auth | Handles Web Push Notifications (FCM VAPID) and Firebase Admin SDK server integration. | [console.firebase.google.com](https://console.firebase.google.com) |
| **ImageKit.io** | Media CDN & Storage | Image and asset hosting, automatic optimization, real-time transformations, and media uploads. | [imagekit.io](https://imagekit.io) |
| **Brevo** (Sendinblue) | Email Service | Primary email service for sending OTPs, transactional emails, and newsletters. | [brevo.com](https://brevo.com) |
| **Razorpay** | Payment Gateway | Handles online donations, registration fee collections, and transaction receipts. | [razorpay.com](https://razorpay.com) |
| **GitHub** | Source Code Repository | Hosting project repositories (`madnieducation` & `madni-education-userside`). | [github.com/MadniEducationTrust](https://github.com/MadniEducationTrust) |
| **Hostinger** | VPS Server Hosting | Linux KVM VPS hosting for production deployment of Next.js apps & API services. | [hostinger.com](https://hostinger.com) |

---

## 🔑 2. Environment Keys Status (`.env.local`)

### ✅ Configured & Active Keys

| Key Name | Category | Description | Status |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Neon Database | Neon PostgreSQL connection string with SSL enabled | **Active (New)** |
| `SESSION_SECRET` | Auth & Security | Encryption key for user session cookies | **Active** |
| `JWT_SECRET` | Auth & Security | Token signature key for API authentication | **Active** |
| `NEXT_PUBLIC_APP_URL` | Application | Application domain (`http://localhost:3000` / production URL) | **Active** |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit | Public client key for ImageKit upload widget | **Active (New)** |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit | Private API key for server-side ImageKit SDK | **Active (New)** |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit | CDN URL Endpoint (`https://ik.imagekit.io/jiolxrfuk`) | **Active (New)** |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Client | Web client API Key for Firebase SDK | **Active (New)** |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Client | Firebase Project ID (`madni-education-trust-b387b`) | **Active (New)** |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Client | Messaging Sender ID for Web Push Notifications | **Active (New)** |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Client | Firebase Web Application Identifier | **Active (New)** |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase Client | Web Push VAPID key pair for FCM notifications | **Active (New)** |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin | Service Account client email for Node.js Admin SDK | **Active (New)** |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin | Service Account RSA Private Key string | **Active (New)** |
| `BREVO_API_KEY` | Brevo Email | Production API Key for transactional email sending | **Active (New)** |
| `BREVO_FROM_EMAIL` | Brevo Email | Verified domain sender (`Madni Education Trust <admin@madnieducation.org>`) | **Active (New)** |

---

### ⏳ Pending / Left to Update (Sharing Later)

The following environment variables are currently set with placeholder/test keys and will be updated once you share the final live production keys:

1. **Razorpay Payment Gateway**:
   - `RAZORPAY_KEY_ID` *(Currently test key `rzp_test_...`; pending live key `rzp_live_...`)*
   - `RAZORPAY_KEY_SECRET` *(Pending live production secret)*

---

## 🖥️ 3. Detailed Step-by-Step Guide: Purchasing & Configuring Hostinger VPS KVM 2 Plan

This step-by-step guide explains exactly how to purchase, configure, and set up your **KVM 2 Linux VPS** on Hostinger after logging in.

---

### Step 1: Log into Hostinger Account & hPanel
1. Open your web browser and go to [hostinger.com](https://www.hostinger.com) or directly [hpanel.hostinger.com](https://hpanel.hostinger.com).
2. Click the **Log In** button in the top right corner.
3. Sign in using your credentials:
   - **Email**: `admin@madnieducation.org`
   - **Password**: `pwPN6xR(5F)pg',z` (or `AQwIKwVowlls1Lrs`)
   *(Note: If you enabled Google Sign-in with your Zoho email, you can click "Sign in with Google").*

---

### Step 2: Navigate to VPS Hosting Section
1. Once logged into the **hPanel Dashboard**, look at the top navigation bar.
2. Click on **VPS** (or navigate to **Hosting** -> **VPS Hosting**).
3. If you are on the homepage, click **Get Started** under VPS Hosting or go to [hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting).

---

### Step 3: Select the KVM 2 VPS Plan
1. On the VPS plans comparison page, review the available tiers.
2. Locate the **KVM 2** Plan and verify its hardware specs:
   - **CPU Cores**: 2 vCPU Cores
   - **RAM**: 8 GB High-Speed RAM
   - **Storage**: 100 GB NVMe Disk Space
   - **Bandwidth**: 8 TB Data Transfer
   - **Dedicated IP**: 1 Static IPv4 Included
   - **Full Root Access**: Enabled
3. Click the **Add to Cart** button under the **KVM 2** plan.

---

### Step 4: Choose Billing Duration (Period)
1. You will be taken to the Checkout screen.
2. Under **Choose a Period**, select your subscription duration:
   - **48 Months**: Lowest monthly cost (~65% discount).
   - **24 Months**: Great balance of price and flexibility.
   - **12 Months**: Recommended standard annual plan.
   - **1 Month**: Short term (higher monthly rate).
3. Confirm that **KVM 2** is selected.

---

### Step 5: Select Payment Method & Complete Checkout
1. Under **Select Payment Method**, choose your preferred payment option:
   - **UPI** (Google Pay, PhonePe, Paytm, BHIM)
   - **Credit / Debit Cards** (Visa, Mastercard, RuPay)
   - **Netbanking**
   - **Razorpay / Wallets**
2. Fill in your billing information:
   - **First / Last Name**: Admin / Madni Education Trust
   - **Country**: India
3. Click **Submit Secure Payment** and complete the payment verification.

---

### Step 6: Initial VPS Setup Wizard (Server Initialization)
Once payment is completed, Hostinger automatically redirects you to the **VPS Setup Wizard** in hPanel:

1. Click **Setup** next to your new **KVM 2** VPS server instance.
2. **Select Server Location**:
   - Choose **Asia (India)** or **Asia (Singapore)**.
   - *Why*: Selecting India/Singapore gives the lowest network latency (<30ms) for users accessing the platform from India.
3. **Select OS / Image Template**:
   - Choose **OS Only** (Plain Linux Distribution).
   - *Important*: Do **NOT** select Webmin, CyberPanel, or Docker pre-builds unless needed; plain OS leaves maximum CPU/RAM free for Next.js.
   - Select **Ubuntu 22.04 LTS (64-bit)** or **Ubuntu 24.04 LTS (64-bit)**.
4. **Set Root SSH Password**:
   - Create a strong, secure password for the `root` user (at least 10 characters, combining uppercase, lowercase, numbers, and special symbols).
   - ⚠️ **Save this Root Password in a secure password manager!** You will need it to log in via SSH terminal.

---

### Step 7: View Server Details & Connect via SSH
1. Once initialization completes (takes about 1-2 minutes), you will see the **VPS Overview** tab in hPanel (`hpanel.hostinger.com`).
2. Note down your server details from the dashboard:
   - **IP Address (IPv4)**: `185.xxx.xxx.xxx` (Your unique dedicated server IP)
   - **SSH Port**: `22`
   - **SSH Username**: `root`
   - **Status**: Running 🟢
3. Open your computer's **PowerShell**, **Command Prompt**, or **Terminal**.
4. Type the SSH connection command and press Enter:
   ```bash
   ssh root@<YOUR_SERVER_IP>
   ```
   *(Replace `<YOUR_SERVER_IP>` with the actual IP address shown in Hostinger hPanel).*
5. When prompted *"Are you sure you want to continue connecting (yes/no)?"*, type `yes`.
6. Enter the **Root Password** you set in Step 6.4.

---

### Step 8: Post-Installation Server Quick Commands (First Run)
Once logged into your VPS via SSH terminal, run these essential commands to update your server and install required runtimes:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js (v20 LTS), Git, Nginx, and PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx
sudo npm install -g pm2

# 3. Verify installations
node -v
npm -v
pm2 -v
```

Your **Hostinger KVM 2 VPS** is now fully purchased, running, and ready for deploying the **Madni Education Trust** Next.js application!
