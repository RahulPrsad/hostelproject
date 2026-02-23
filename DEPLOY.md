# Deploy QR Hostel Management

## 1. Push code to GitHub

If the project is not a git repo yet:

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new repository on [GitHub](https://github.com/new), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## 2. Set up MongoDB Atlas (free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up.
2. Create a **free cluster** (M0).
3. Under **Database Access** → Add user (username + password).
4. Under **Network Access** → Add IP **0.0.0.0/0** (allow from anywhere for Render).
5. Click **Connect** on the cluster → **Connect your application** → copy the connection string.  
   It looks like: `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/hostel_db?retryWrites=true&w=majority`  
   Replace `<password>` with your DB user password and optionally change `hostel_db` to your DB name.

## 3. Deploy on Render

1. Go to [Render](https://render.com) and sign up (or use GitHub login).
2. **New** → **Web Service**.
3. Connect your GitHub account and select the **qr-hostel-management** repo.
4. Render will detect the app. If you added `render.yaml`, you can use **Apply** from the Blueprint; otherwise set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. In **Environment**, add these variables (use **Secret** for sensitive ones):

   | Key | Value |
   |-----|--------|
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | A long random string (e.g. from a password generator) |
   | `APP_URL` | `https://YOUR-SERVICE-NAME.onrender.com` (your Render URL) |
   | `NODEMAILER_HOST` | `smtp.gmail.com` |
   | `NODEMAILER_PORT` | `587` |
   | `NODEMAILER_USER` | Your Gmail address |
   | `NODEMAILER_PASS` | Gmail [App Password](https://support.google.com/accounts/answer/185833) (not your normal password) |

6. Click **Create Web Service**. Render will build and deploy; your app will be at `https://YOUR-SERVICE-NAME.onrender.com`.

## 4. After first deploy

- **Seed admin (optional):** Run `npm run seed:admin` locally once with `MONGODB_URI` pointing to your Atlas database, or add a one-off script/route to seed the admin user in production.
- Free tier spins down after ~15 min of no traffic; the first request may take 30–60 seconds to wake up.
