import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { hashPassword } from "./index";
import { api } from "@shared/routes";
import { openai } from "./openai";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Auth Routes ────────────────────────────────────────────────────────────

  app.post("/api/admin/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  });

  app.post("/api/admin/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/admin/me", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  // ─── Public Routes ──────────────────────────────────────────────────────────

  app.get(api.categories.list.path, async (req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.get(api.categories.getBySlug.path, async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  });

  app.get(api.products.list.path, async (req, res) => {
    const prods = await storage.getProducts();
    res.json(prods);
  });

  app.get(api.products.getByCategory.path, async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) return res.status(404).json({ message: "Category not found" });
    const prods = await storage.getProductsByCategory(category.id);
    res.json(prods);
  });

  app.get(api.products.getBySlug.path, async (req, res) => {
    const product = await storage.getProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.get(api.links.bio.path, async (req, res) => {
    const bioCats = await storage.getLinkBioCategories();
    const data = await Promise.all(
      bioCats.map(async (category) => {
        const items = await storage.getLinkBioItemsByCategory(category.id);
        return { category, items };
      })
    );
    res.json(data);
  });

  // Affiliate redirect
  app.get("/go/:slug", async (req, res) => {
    const { slug } = req.params;
    const link = await storage.getAffiliateLinkBySlug(slug);
    await storage.logClick({
      slug,
      date: new Date().toISOString().split("T")[0],
      userAgent: req.headers["user-agent"] || "Unknown",
      referer: req.headers.referer || "Direct",
      country: (req.headers["cf-ipcountry"] as string) || "Unknown",
    });
    if (link) {
      res.redirect(302, link.url);
    } else {
      res.redirect(302, "/");
    }
  });

  // ─── Admin-Only Stats ───────────────────────────────────────────────────────

  app.get(api.stats.dashboard.path, requireAdmin, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // ─── Admin CRUD: Categories ─────────────────────────────────────────────────

  app.get("/api/admin/categories", requireAdmin, async (req, res) => {
    res.json(await storage.getCategories());
  });

  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const category = await storage.updateCategory(parseInt(req.params.id), req.body);
      res.json(category);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ─── Admin CRUD: Products ───────────────────────────────────────────────────

  app.get("/api/admin/products", requireAdmin, async (req, res) => {
    res.json(await storage.getProducts());
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (typeof body.features === "string") body.features = body.features.split("\n").filter(Boolean);
      if (typeof body.pros === "string") body.pros = body.pros.split("\n").filter(Boolean);
      if (typeof body.cons === "string") body.cons = body.cons.split("\n").filter(Boolean);
      if (typeof body.scores === "string") body.scores = JSON.parse(body.scores);
      if (typeof body.categoryId === "string") body.categoryId = parseInt(body.categoryId);
      const product = await storage.createProduct(body);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (typeof body.features === "string") body.features = body.features.split("\n").filter(Boolean);
      if (typeof body.pros === "string") body.pros = body.pros.split("\n").filter(Boolean);
      if (typeof body.cons === "string") body.cons = body.cons.split("\n").filter(Boolean);
      if (typeof body.scores === "string") body.scores = JSON.parse(body.scores);
      if (typeof body.categoryId === "string") body.categoryId = parseInt(body.categoryId);
      const product = await storage.updateProduct(parseInt(req.params.id), body);
      res.json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ─── Admin: AI Auto-Generate Product ────────────────────────────────────────

  app.post("/api/admin/auto-generate-product", requireAdmin, async (req, res) => {
    try {
      const { categoryId, productName } = req.body;
      if (!categoryId) return res.status(400).json({ message: "categoryId is required" });

      const category = await storage.getCategoryById(parseInt(categoryId));
      if (!category) return res.status(404).json({ message: "Category not found" });

      const prompt = `You are an expert affiliate product reviewer. Generate a complete, realistic, and detailed product review for "${productName || "a top product"}" in the "${category.name}" category (${category.description}).

Return ONLY a valid JSON object with exactly this structure (no markdown, no code fences):
{
  "name": "Product Name",
  "slug": "product-name-lowercase-hyphenated",
  "logo": "https://logo.clearbit.com/productwebsite.com",
  "rating": "4.8",
  "price": "$X.XX/mo",
  "originalPrice": "$XX.XX/mo",
  "discount": "XX%",
  "affiliateSlug": "productname",
  "affiliateUrl": "https://productwebsite.com",
  "affiliateProgram": "Product Name Partners",
  "commission": "40%",
  "cookieDays": 30,
  "badge": "🏆 Editor's Choice",
  "shortDescription": "One compelling sentence about the product.",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "pros": ["Pro 1", "Pro 2", "Pro 3", "Pro 4"],
  "cons": ["Con 1", "Con 2"],
  "bestFor": "Who this product is best for.",
  "scores": { "speed": 90, "security": 92, "value": 88, "ease": 94 },
  "detailedReview": "Write 2-3 paragraphs of a detailed, honest, and helpful expert review of this product covering its main strengths, key use cases, and how it compares to competitors."
}

Be realistic and accurate. Use real product data if you know it. Make all scores between 75-99. Make the review sound professional and trustworthy.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const raw = response.choices[0]?.message?.content || "{}";
      const generated = JSON.parse(raw);

      const existingBySlug = await storage.getProductBySlug(generated.slug);
      if (existingBySlug) {
        generated.slug = `${generated.slug}-${Date.now()}`;
      }

      const existingLink = await storage.getAffiliateLinkBySlug(generated.affiliateSlug);
      if (!existingLink) {
        await storage.createAffiliateLink({
          slug: generated.affiliateSlug,
          url: generated.affiliateUrl || `https://example.com/aff/${generated.affiliateSlug}`,
          program: generated.affiliateProgram || `${generated.name} Partners`,
          commission: generated.commission || "40%",
          cookieDays: generated.cookieDays || 30,
        });
      }

      const product = await storage.createProduct({
        categoryId: parseInt(categoryId),
        slug: generated.slug,
        name: generated.name,
        logo: generated.logo || "",
        rating: generated.rating || "4.5",
        price: generated.price || "N/A",
        originalPrice: generated.originalPrice || "N/A",
        discount: generated.discount || "0%",
        affiliateSlug: generated.affiliateSlug,
        badge: generated.badge || null,
        shortDescription: generated.shortDescription || "",
        features: Array.isArray(generated.features) ? generated.features : [],
        pros: Array.isArray(generated.pros) ? generated.pros : [],
        cons: Array.isArray(generated.cons) ? generated.cons : [],
        bestFor: generated.bestFor || "",
        scores: generated.scores || { speed: 85, security: 85, value: 85, ease: 85 },
        detailedReview: generated.detailedReview || "",
      });

      res.status(201).json(product);
    } catch (err: any) {
      console.error("Auto-generate error:", err);
      res.status(500).json({ message: err.message || "Failed to generate product" });
    }
  });

  // ─── Admin CRUD: Affiliate Links ────────────────────────────────────────────

  app.get("/api/admin/affiliate-links", requireAdmin, async (req, res) => {
    res.json(await storage.getAffiliateLinks());
  });

  app.post("/api/admin/affiliate-links", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (typeof body.cookieDays === "string") body.cookieDays = parseInt(body.cookieDays);
      const link = await storage.createAffiliateLink(body);
      res.status(201).json(link);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/admin/affiliate-links/:id", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (typeof body.cookieDays === "string") body.cookieDays = parseInt(body.cookieDays);
      const link = await storage.updateAffiliateLink(parseInt(req.params.id), body);
      res.json(link);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/affiliate-links/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteAffiliateLink(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ─── Admin CRUD: Link Bio Categories ───────────────────────────────────────

  app.get("/api/admin/link-bio-categories", requireAdmin, async (req, res) => {
    res.json(await storage.getLinkBioCategories());
  });

  app.post("/api/admin/link-bio-categories", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (typeof body.sortOrder === "string") body.sortOrder = parseInt(body.sortOrder);
      const cat = await storage.createLinkBioCategory(body);
      res.status(201).json(cat);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/admin/link-bio-categories/:id", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (typeof body.sortOrder === "string") body.sortOrder = parseInt(body.sortOrder);
      const cat = await storage.updateLinkBioCategory(parseInt(req.params.id), body);
      res.json(cat);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/link-bio-categories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteLinkBioCategory(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ─── Admin CRUD: Link Bio Items ─────────────────────────────────────────────

  app.get("/api/admin/link-bio-items", requireAdmin, async (req, res) => {
    res.json(await storage.getAllLinkBioItems());
  });

  app.post("/api/admin/link-bio-items", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (typeof body.categoryId === "string") body.categoryId = parseInt(body.categoryId);
      if (typeof body.sortOrder === "string") body.sortOrder = parseInt(body.sortOrder);
      if (typeof body.isHot === "string") body.isHot = body.isHot === "true";
      const item = await storage.createLinkBioItem(body);
      res.status(201).json(item);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/admin/link-bio-items/:id", requireAdmin, async (req, res) => {
    try {
      const body = req.body;
      if (typeof body.categoryId === "string") body.categoryId = parseInt(body.categoryId);
      if (typeof body.sortOrder === "string") body.sortOrder = parseInt(body.sortOrder);
      if (typeof body.isHot === "string") body.isHot = body.isHot === "true";
      const item = await storage.updateLinkBioItem(parseInt(req.params.id), body);
      res.json(item);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/link-bio-items/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteLinkBioItem(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ─── Public Webhook: n8n → Pending Queue ────────────────────────────────────

  app.post("/api/webhook/products", async (req, res) => {
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    if (!apiKey || apiKey !== process.env.WEBHOOK_API_KEY) {
      return res.status(401).json({ message: "Invalid or missing API key" });
    }

    try {
      const body = req.body;
      const products = Array.isArray(body) ? body : [body];
      const created: any[] = [];

      for (const item of products) {
        if (!item.name || !item.categoryId) continue;

        if (typeof item.features === "string") item.features = item.features.split("\n").filter(Boolean);
        if (typeof item.pros === "string") item.pros = item.pros.split("\n").filter(Boolean);
        if (typeof item.cons === "string") item.cons = item.cons.split("\n").filter(Boolean);
        if (typeof item.scores === "string") item.scores = JSON.parse(item.scores);
        if (typeof item.categoryId === "string") item.categoryId = parseInt(item.categoryId);
        if (typeof item.cookieDays === "string") item.cookieDays = parseInt(item.cookieDays);

        const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const affiliateSlug = item.affiliateSlug || slug;

        const pending = await storage.createPendingProduct({
          categoryId: item.categoryId,
          name: item.name,
          slug,
          logo: item.logo || "",
          rating: item.rating || "4.5",
          price: item.price || "N/A",
          originalPrice: item.originalPrice || item.price || "N/A",
          discount: item.discount || "0%",
          affiliateSlug,
          affiliateUrl: item.affiliateUrl || item.url || "",
          affiliateProgram: item.affiliateProgram || item.program || `${item.name} Partners`,
          commission: item.commission || "0%",
          cookieDays: item.cookieDays || 30,
          badge: item.badge || null,
          shortDescription: item.shortDescription || item.description || "",
          features: Array.isArray(item.features) ? item.features : [],
          pros: Array.isArray(item.pros) ? item.pros : [],
          cons: Array.isArray(item.cons) ? item.cons : [],
          bestFor: item.bestFor || "",
          scores: item.scores || { speed: 85, security: 85, value: 85, ease: 85 },
          detailedReview: item.detailedReview || item.review || "",
          source: item.source || "n8n",
          status: "pending",
        });
        created.push(pending);
      }

      res.status(201).json({ received: created.length, products: created });
    } catch (err: any) {
      console.error("Webhook error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Admin: Pending Products (Approval Queue) ────────────────────────────────

  app.get("/api/admin/pending-products", requireAdmin, async (req, res) => {
    const status = req.query.status as string | undefined;
    res.json(await storage.getPendingProducts(status));
  });

  app.post("/api/admin/pending-products/:id/approve", requireAdmin, async (req, res) => {
    try {
      const product = await storage.approvePendingProduct(parseInt(req.params.id));
      res.json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/admin/pending-products/:id/reject", requireAdmin, async (req, res) => {
    try {
      await storage.rejectPendingProduct(parseInt(req.params.id));
      res.json({ message: "Rejected" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/pending-products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePendingProduct(parseInt(req.params.id));
      res.json({ message: "Deleted" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // ─── Seed ───────────────────────────────────────────────────────────────────

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingCategories = await storage.getCategories();
  if (existingCategories.length > 0) {
    await ensureAdminUser();
    return;
  }

  const vpnCategory = await storage.createCategory({
    slug: "vpn", name: "VPNs", title: "Best VPN Services of 2026",
    description: "We rigorously tested 20+ VPNs for speed, privacy, and streaming. Here are the top picks for total digital anonymity.",
    icon: "Shield"
  });

  const antivirusCategory = await storage.createCategory({
    slug: "antivirus", name: "Antivirus", title: "Best Antivirus Software 2026",
    description: "Protect your devices from malware, ransomware, and phishing with our expert-tested security suites.",
    icon: "Lock"
  });

  const passwordManagerCategory = await storage.createCategory({
    slug: "password-manager", name: "Password Managers", title: "Top-Rated Password Managers",
    description: "Stop reusing passwords. Secure your digital life with the most reliable vault solutions on the market.",
    icon: "Key"
  });

  const hostingCategory = await storage.createCategory({
    slug: "hosting", name: "Web Hosting", title: "Best Web Hosting Providers",
    description: "From shared hosting to dedicated servers, we found the providers with 99.9% uptime and lightning speeds.",
    icon: "Server"
  });

  const vId = vpnCategory.id;
  const avId = antivirusCategory.id;
  const pmId = passwordManagerCategory.id;
  const hId = hostingCategory.id;

  const productsData = [
    {
      categoryId: vId, slug: "nordvpn", name: "NordVPN",
      logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/NordVPN_logo.svg",
      rating: "4.9", price: "$3.99/mo", originalPrice: "$11.99/mo", discount: "67%",
      affiliateSlug: "nordvpn", badge: "🏆 Editor's Choice",
      shortDescription: "The gold standard for privacy and blazing-fast speeds.",
      features: ["Double VPN", "Onion Over VPN", "Threat Protection Pro", "6000+ Servers", "Meshnet", "Dark Web Monitor"],
      pros: ["Fastest speeds tested", "Audited no-logs policy", "Unblocks 15+ Netflix regions", "Excellent 24/7 support"],
      cons: ["Renewal price increase", "Map UI takes up space"],
      bestFor: "Power users who want the absolute best security and speed combo.",
      scores: { speed: 98, security: 99, value: 92, ease: 94 },
      detailedReview: "NordVPN continues to lead the pack in 2026 with its revolutionary NordLynx protocol."
    },
    {
      categoryId: avId, slug: "bitdefender", name: "Bitdefender",
      logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/Bitdefender_Logo.png",
      rating: "4.8", price: "$29.99/yr", originalPrice: "$84.99/yr", discount: "65%",
      affiliateSlug: "bitdefender", badge: "🛡️ Maximum Protection",
      shortDescription: "Award-winning malware detection with minimal system impact.",
      features: ["Real-time Data Protection", "Advanced Threat Defense", "Anti-tracker", "VPN Included", "Microphone Monitor"],
      pros: ["Perfect malware detection scores", "Very light on system resources", "Comprehensive privacy tools", "Multi-layer ransomware protection"],
      cons: ["VPN has daily data limit", "iOS app is limited"],
      bestFor: "Families and users who want set-and-forget ultimate security.",
      scores: { speed: 95, security: 100, value: 90, ease: 96 },
      detailedReview: "Bitdefender Total Security offers the most robust malware protection we've ever tested."
    },
    {
      categoryId: pmId, slug: "1password", name: "1Password",
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/1Password_logo.svg",
      rating: "4.9", price: "$2.99/mo", originalPrice: "$4.99/mo", discount: "40%",
      affiliateSlug: "1password", badge: "🔑 Most Secure",
      shortDescription: "The most intuitive and secure way to manage your digital identity.",
      features: ["Secret Key Protection", "Watchtower Security", "Travel Mode", "Unlimited Devices", "Digital Wallet"],
      pros: ["Unique Secret Key security", "Beautiful user interface", "Excellent browser extension", "Strong family sharing"],
      cons: ["No free tier", "Setup takes a bit longer"],
      bestFor: "Anyone looking for the perfect balance of high security and premium design.",
      scores: { speed: 90, security: 100, value: 88, ease: 98 },
      detailedReview: "1Password's Secret Key adds an extra layer of protection that most competitors lack."
    },
    {
      categoryId: hId, slug: "siteground", name: "SiteGround",
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/SiteGround_Logo.svg",
      rating: "4.7", price: "$2.99/mo", originalPrice: "$14.99/mo", discount: "80%",
      affiliateSlug: "siteground", badge: "🚀 Top Performance",
      shortDescription: "Premium hosting managed on Google Cloud with top-tier support.",
      features: ["Google Cloud Infrastructure", "Ultrafast PHP", "Free CDN", "Free SSL", "Daily Backups", "Managed WordPress"],
      pros: ["Exceptional uptime", "Superior customer support", "Advanced caching included", "Easy staging sites"],
      cons: ["Lower storage limits", "Renewal prices jump significantly"],
      bestFor: "Small to medium businesses that prioritize speed and expert support.",
      scores: { speed: 99, security: 95, value: 85, ease: 97 },
      detailedReview: "SiteGround is our top recommendation for serious websites built on Google Cloud."
    },
    {
      categoryId: vId, slug: "expressvpn", name: "ExpressVPN",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/22/ExpressVPN_logo.png",
      rating: "4.8", price: "$6.67/mo", originalPrice: "$12.95/mo", discount: "49%",
      affiliateSlug: "expressvpn", badge: "⚡ Fastest",
      shortDescription: "Premium VPN with incredibly fast servers worldwide.",
      features: ["Lightway Protocol", "TrustedServer Technology", "24/7 Support", "Split Tunneling", "Password Manager"],
      pros: ["Lightning fast", "Huge server network", "Great customer support", "Custom router app"],
      cons: ["More expensive", "Fewer simultaneous connections"],
      bestFor: "Users who want a premium, fast experience regardless of price.",
      scores: { speed: 98, security: 95, value: 85, ease: 95 },
      detailedReview: "ExpressVPN is known for its incredible speeds and ease of use."
    },
    {
      categoryId: vId, slug: "surfshark", name: "Surfshark",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Surfshark_logo_2021.svg",
      rating: "4.7", price: "$2.49/mo", originalPrice: "$10.99/mo", discount: "77%",
      affiliateSlug: "surfshark", badge: "💰 Best Value",
      shortDescription: "Unlimited devices and great features for a low price.",
      features: ["Unlimited Devices", "CleanWeb", "Bypasser", "Camouflage Mode", "NoBorders Mode"],
      pros: ["Unlimited simultaneous connections", "Very affordable", "Fast WireGuard speeds", "Good unblocking"],
      cons: ["Some servers can be slow", "Customer support could be better"],
      bestFor: "Families or users with many devices on a budget.",
      scores: { speed: 90, security: 92, value: 99, ease: 88 },
      detailedReview: "Surfshark shook up the VPN industry by offering unlimited simultaneous connections at an incredibly low price."
    }
  ];

  for (const prod of productsData) {
    await storage.createProduct(prod);
    await storage.createAffiliateLink({
      slug: prod.affiliateSlug,
      url: `https://example.com/aff/${prod.affiliateSlug}?ref=MYID`,
      program: `${prod.name} Partners`,
      commission: "40%",
      cookieDays: 30
    });
  }

  const bioCat = await storage.createLinkBioCategory({ title: "Best Privacy Tools", sortOrder: 1 });
  await storage.createLinkBioItem({ categoryId: bioCat.id, name: "NordVPN", description: "Best overall VPN (67% OFF)", slug: "nordvpn", emoji: "🛡️", isHot: true, sortOrder: 1 });
  await storage.createLinkBioItem({ categoryId: bioCat.id, name: "ExpressVPN", description: "Fastest premium VPN", slug: "expressvpn", emoji: "⚡", isHot: false, sortOrder: 2 });

  await ensureAdminUser();
}

async function ensureAdminUser() {
  const existing = await storage.getAdminByUsername("admin");
  if (!existing) {
    const passwordHash = await hashPassword("admin123");
    await storage.createAdminUser({ username: "admin", passwordHash });
    console.log("Default admin created: username=admin password=admin123");
  }
}
