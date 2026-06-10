# Deploy QR Hostel Management

After deployment, you do not run `server.js` on your laptop for normal use. Render runs the Node server online, MongoDB Atlas stores the data online, and the admin APK opens your Render URL.

## 1. Push Code To GitHub

If needed:

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new repository on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## 2. Set Up MongoDB Atlas

1. Create a free MongoDB Atlas cluster.
2. In Database Access, add a database user and password.
3. In Network Access, add `0.0.0.0/0` so Render can connect.
4. Copy the application connection string.

Example:

```text
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/hostel_db?retryWrites=true&w=majority
```

## 3. Deploy On Render

1. Go to Render.
2. Create a new Web Service from your GitHub repo.
3. Use:

```text
Build Command: npm install
Start Command: npm start
```

4. Add environment variables:

| Key | Value |
| --- | --- |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random secret |
| `JWT_EXPIRE` | `7d` |
| `APP_URL` | `https://YOUR-SERVICE-NAME.onrender.com` |
| `NODEMAILER_HOST` | `smtp.gmail.com` |
| `NODEMAILER_PORT` | `587` |
| `NODEMAILER_USER` | Your Gmail address |
| `NODEMAILER_PASS` | Your Gmail app password |
| `ADMIN_EMAIL` | Admin email, for example `admin@hostel.com` |
| `ADMIN_PASSWORD` | Admin password |

## 4. Create The Admin User

After the first deploy, open your Render service Shell and run:

```bash
npm run seed:admin
```

Then login here:

```text
https://YOUR-SERVICE-NAME.onrender.com/login
```

## 5. Use The Admin APK

Open the APK and enter your deployed login URL:

```text
https://YOUR-SERVICE-NAME.onrender.com/login
```

Do not use `localhost` on the phone. `localhost` means the phone itself, not your deployed hostel server.

On Render free tier, the first request can take 30 to 60 seconds if the service was sleeping.
