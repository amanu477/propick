import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get(api.categories.getBySlug.path, async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  });

  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.getByCategory.path, async (req, res) => {
    const category = await storage.getCategoryBySlug(req.params.slug);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const products = await storage.getProductsByCategory(category.id);
    res.json(products);
  });

  app.get(api.products.getBySlug.path, async (req, res) => {
    const product = await storage.getProductBySlug(req.params.slug);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  app.get(api.links.bio.path, async (req, res) => {
    const categories = await storage.getLinkBioCategories();
    const data = await Promise.all(categories.map(async (category) => {
      const items = await storage.getLinkBioItemsByCategory(category.id);
      return { category, items };
    }));
    res.json(data);
  });

  app.get(api.stats.dashboard.path, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Redirect handler
  app.get('/go/:slug', async (req, res) => {
    const { slug } = req.params;
    const link = await storage.getAffiliateLinkBySlug(slug);
    
    // Log the click
    await storage.logClick({
      slug,
      date: new Date().toISOString().split('T')[0],
      userAgent: req.headers['user-agent'] || 'Unknown',
      referer: req.headers.referer || 'Direct',
      country: (req.headers['cf-ipcountry'] as string) || 'Unknown'
    });

    if (link) {
      res.redirect(302, link.url);
    } else {
      res.redirect(302, '/');
    }
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingCategories = await storage.getCategories();
  if (existingCategories.length > 0) return;

  const vpnCategory = await storage.createCategory({
    slug: "vpn",
    name: "VPNs",
    title: "Best VPN Services",
    description: "We tested 15+ services to find the best VPNs for speed, security, and streaming.",
    icon: "Shield"
  });

  const catId = vpnCategory.id;

  const productsData = [
    {
      categoryId: catId,
      slug: "nordvpn",
      name: "NordVPN",
      logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/NordVPN_logo.svg",
      rating: "4.8",
      price: "$3.99/mo",
      originalPrice: "$11.99/mo",
      discount: "67%",
      affiliateSlug: "nordvpn",
      badge: "🏆 Editor's Choice",
      shortDescription: "The best all-around VPN for speed and security.",
      features: ["A-E-256 Encryption", "Threat Protection", "Strict No-logs Policy", "Meshnet", "Dark Web Monitor"],
      pros: ["Fastest speeds", "Great security features", "Easy to use", "Unblocks Netflix reliable"],
      cons: ["Map interface can be clunky", "Linux app has no GUI"],
      bestFor: "Best overall VPN for security, speed, and streaming.",
      scores: { speed: 95, security: 98, value: 92, ease: 90 },
      detailedReview: "NordVPN is our top pick because it consistently delivers the fastest speeds and strongest security features. With servers in 60+ countries, it's perfect for unblocking geo-restricted content.\n\nIts Threat Protection feature goes beyond a normal VPN by blocking malware, ads, and trackers before they can even reach your device."
    },
    {
      categoryId: catId,
      slug: "expressvpn",
      name: "ExpressVPN",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/22/ExpressVPN_logo.png",
      rating: "4.7",
      price: "$6.67/mo",
      originalPrice: "$12.95/mo",
      discount: "49%",
      affiliateSlug: "expressvpn",
      badge: "⚡ Fastest",
      shortDescription: "Premium VPN with incredibly fast servers worldwide.",
      features: ["Lightway Protocol", "TrustedServer Technology", "24/7 Support", "Split Tunneling", "Password Manager"],
      pros: ["Lightning fast", "Huge server network", "Great customer support", "Custom router app"],
      cons: ["More expensive", "Fewer simultaneous connections"],
      bestFor: "Users who want a premium, fast experience regardless of price.",
      scores: { speed: 98, security: 95, value: 85, ease: 95 },
      detailedReview: "ExpressVPN is known for its incredible speeds and ease of use. It's a premium product with a premium price tag, but for many users, the zero-hassle experience is worth the extra cost.\n\nTheir proprietary Lightway protocol ensures fast connections and low battery drain on mobile devices."
    },
    {
      categoryId: catId,
      slug: "surfshark",
      name: "Surfshark",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Surfshark_logo_2021.svg",
      rating: "4.6",
      price: "$2.49/mo",
      originalPrice: "$10.99/mo",
      discount: "77%",
      affiliateSlug: "surfshark",
      badge: "💰 Best Value",
      shortDescription: "Unlimited devices and great features for a low price.",
      features: ["Unlimited Devices", "CleanWeb", "Bypasser", "Camouflage Mode", "NoBorders Mode"],
      pros: ["Unlimited simultaneous connections", "Very affordable", "Fast WireGuard speeds", "Good unblocking"],
      cons: ["Some servers can be slow", "Customer support could be better"],
      bestFor: "Families or users with many devices on a budget.",
      scores: { speed: 88, security: 90, value: 98, ease: 85 },
      detailedReview: "Surfshark shook up the VPN industry by offering unlimited simultaneous connections at an incredibly low price. It's the perfect choice for families or anyone with a lot of devices to protect.\n\nDespite the low price, it doesn't skimp on features, offering a robust ad blocker and a strict no-logs policy."
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

  // Seed Link-in-Bio
  const bioCat = await storage.createLinkBioCategory({
    title: "Best Privacy Tools",
    sortOrder: 1
  });

  await storage.createLinkBioItem({
    categoryId: bioCat.id,
    name: "NordVPN",
    description: "Best overall VPN (67% OFF)",
    slug: "nordvpn",
    emoji: "🛡️",
    isHot: true,
    sortOrder: 1
  });
  
  await storage.createLinkBioItem({
    categoryId: bioCat.id,
    name: "ExpressVPN",
    description: "Fastest premium VPN",
    slug: "expressvpn",
    emoji: "⚡",
    isHot: false,
    sortOrder: 2
  });
}
