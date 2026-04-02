import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import cron from "node-cron";
import { runAutoDiscovery } from "./discovery";

const scryptAsync = promisify(scrypt);

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    adminId?: number;
  }
}

// Parse JSON
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Session setup
const MemStore = MemoryStore(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "pickvera-admin-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new MemStore({ checkPeriod: 86400000 }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getAdminByUsername(username);
      if (!user) return done(null, false, { message: "Invalid credentials" });

      const [salt, storedHash] = user.passwordHash.split(":");
      const hashBuffer = (await scryptAsync(password, salt, 64)) as Buffer;
      const storedHashBuffer = Buffer.from(storedHash, "hex");

      if (
        hashBuffer.length !== storedHashBuffer.length ||
        !timingSafeEqual(hashBuffer, storedHashBuffer)
      ) {
        return done(null, false, { message: "Invalid credentials" });
      }

      return done(null, { id: user.id, username: user.username });
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getAdminById(id);
    if (!user) return done(null, false);
    done(null, { id: user.id, username: user.username });
  } catch (err) {
    done(err);
  }
});

// Logger
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString("hex")}`;
}

// Start server
(async () => {
  await registerRoutes(httpServer, app);

  // ─── Daily auto-discovery scheduler ─────────────────
  cron.schedule("0 8 * * *", async () => {
    log("Running scheduled auto-discovery...", "cron");
    try {
      const count = await runAutoDiscovery((p) => {
        if (p.type === "done" || p.type === "error") log(p.message, "cron");
      });
      log(`Scheduled discovery complete: ${count} products queued`, "cron");
    } catch (err: any) {
      log(`Scheduled discovery error: ${err.message}`, "cron");
    }
  });

  // Error handler
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  // Static / Vite
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Server listen (Windows safe)
  const port = parseInt(process.env.PORT || "5000", 10);

  httpServer.listen(port, () => {
    log(`serving on http://localhost:${port}`);
  });
})();