# Deploy QR Hostel Management On Vercel

This project is now set up for Vercel.

- Local development uses `server.js`.
- Vercel uses `api/index.js`.
- MongoDB Atlas stores the online data.
- The admin APK must open the final Vercel URL, not `localhost`.

## 1. Push Code To GitHub

From the project folder:

```bash
git add .
git commit -m "Configure Vercel deployment"
git push origin main
```

## 2. Import Project In Vercel

1. Open Vercel.
2. Click **Add New**.
3. Click **Project**.
4. Import `RahulPrsad/hostelproject`.
5. Use these settings:

```text
Framework Preset: Other
Root Directory: ./
Build Command: npm install
Output Directory: leave empty
Install Command: npm install
```

Vercel will use `vercel.json` and route all requests to `api/index.js`.

## 3. Add Environment Variables

In Vercel Project Settings, open **Environment Variables** and add:

```env
MONGODB_URI=mongodb+srv://prasadrr1_db_user:YOUR_DB_PASSWORD@hosteldb.iwsdhyz.mongodb.net/hostel_db?appName=hosteldb
JWT_SECRET=8fK#92mLp$Xz7QvN1rTy@45AbCdEfGhJ
JWT_EXPIRE=7d

NODEMAILER_HOST=smtp.gmail.com
NODEMAILER_PORT=587
NODEMAILER_USER=rahulprasad9567@gmail.com
NODEMAILER_PASS=YOUR_GMAIL_APP_PASSWORD

APP_URL=https://hostelproject-omega.vercel.app/login

ADMIN_EMAIL=admin@hostel.com
ADMIN_PASSWORD=admin123

AUTH_RATE_LIMIT_MAX=1000
MONGODB_MAX_POOL_SIZE=10
MONGODB_SERVER_SELECTION_TIMEOUT_MS=10000
```

Replace:

- `YOUR_DB_PASSWORD` with your MongoDB Atlas password.
- `YOUR_GMAIL_APP_PASSWORD` with your Gmail app password.
- `APP_URL` should point to your live login page.

Do not add `PORT` on Vercel. Vercel manages the port.

For around 500 users, keep `AUTH_RATE_LIMIT_MAX=1000` or higher. This limit now applies only to submitted auth forms, not normal page views.

## 4. Deploy

Click **Deploy** in Vercel.

After deployment, your web app will be available at:

```text
https://hostelproject-omega.vercel.app/login
```

## 5. Create Admin User

Run the seed command once from your laptop using the same Atlas database:

```bash
npm run seed:admin
```

This creates:

```text
Email: admin@hostel.com
Password: admin123
```

## 6. Use The Admin APK

Open the APK on the phone and enter:

```text
https://hostelproject-omega.vercel.app/login
```

Do not use:

```text
localhost
10.0.2.2
```

Those only work on a laptop or emulator, not on a real phone.
