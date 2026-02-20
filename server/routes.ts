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
    title: "Best VPN Services of 2026",
    description: "We rigorously tested 20+ VPNs for speed, privacy, and streaming. Here are the top picks for total digital anonymity.",
    icon: "Shield"
  });

  const antivirusCategory = await storage.createCategory({
    slug: "antivirus",
    name: "Antivirus",
    title: "Best Antivirus Software 2026",
    description: "Protect your devices from malware, ransomware, and phishing with our expert-tested security suites.",
    icon: "Lock"
  });

  const passwordManagerCategory = await storage.createCategory({
    slug: "password-manager",
    name: "Password Managers",
    title: "Top-Rated Password Managers",
    description: "Stop reusing passwords. Secure your digital life with the most reliable vault solutions on the market.",
    icon: "Key"
  });

  const hostingCategory = await storage.createCategory({
    slug: "hosting",
    name: "Web Hosting",
    title: "Best Web Hosting Providers",
    description: "From shared hosting to dedicated servers, we found the providers with 99.9% uptime and lightning speeds.",
    icon: "Server"
  });

  const vId = vpnCategory.id;
  const avId = antivirusCategory.id;
  const pmId = passwordManagerCategory.id;
  const hId = hostingCategory.id;

  const productsData = [
    {
      categoryId: vId,
      slug: "nordvpn",
      name: "NordVPN",
      logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/NordVPN_logo.svg",
      rating: "4.9",
      price: "$3.99/mo",
      originalPrice: "$11.99/mo",
      discount: "67%",
      affiliateSlug: "nordvpn",
      badge: "🏆 Editor's Choice",
      shortDescription: "The gold standard for privacy and blazing-fast speeds.",
      features: ["Double VPN", "Onion Over VPN", "Threat Protection Pro", "6000+ Servers", "Meshnet", "Dark Web Monitor"],
      pros: ["Fastest speeds tested", "Audited no-logs policy", "Unblocks 15+ Netflix regions", "Excellent 24/7 support"],
      cons: ["Renewal price increase", "Map UI takes up space"],
      bestFor: "Power users who want the absolute best security and speed combo.",
      scores: { speed: 98, security: 99, value: 92, ease: 94 },
      detailedReview: "NordVPN continues to lead the pack in 2026 with its revolutionary NordLynx protocol. It's not just a VPN; it's a complete security suite that blocks trackers and malware before they reach your device."
    },
    {
      categoryId: avId,
      slug: "bitdefender",
      name: "Bitdefender",
      logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/Bitdefender_Logo.png",
      rating: "4.8",
      price: "$29.99/yr",
      originalPrice: "$84.99/yr",
      discount: "65%",
      affiliateSlug: "bitdefender",
      badge: "🛡️ Maximum Protection",
      shortDescription: "Award-winning malware detection with minimal system impact.",
      features: ["Real-time Data Protection", "Advanced Threat Defense", "Anti-tracker", "VPN Included", "Microphone Monitor"],
      pros: ["Perfect malware detection scores", "Very light on system resources", "Comprehensive privacy tools", "Multi-layer ransomware protection"],
      cons: ["VPN has daily data limit", "iOS app is limited"],
      bestFor: "Families and users who want 'set-and-forget' ultimate security.",
      scores: { speed: 95, security: 100, value: 90, ease: 96 },
      detailedReview: "Bitdefender Total Security offers the most robust malware protection we've ever tested. Its Autopilot feature handles all security decisions automatically, making it perfect for non-technical users."
    },
    {
      categoryId: pmId,
      slug: "1password",
      name: "1Password",
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/1Password_logo.svg",
      rating: "4.9",
      price: "$2.99/mo",
      originalPrice: "$4.99/mo",
      discount: "40%",
      affiliateSlug: "1password",
      badge: "🔑 Most Secure",
      shortDescription: "The most intuitive and secure way to manage your digital identity.",
      features: ["Secret Key Protection", "Watchtower Security", "Travel Mode", "Unlimited Devices", "Digital Wallet"],
      pros: ["Unique Secret Key security", "Beautiful user interface", "Excellent browser extension", "Strong family sharing"],
      cons: ["No free tier", "Setup takes a bit longer"],
      bestFor: "Anyone looking for the perfect balance of high security and premium design.",
      scores: { speed: 90, security: 100, value: 88, ease: 98 },
      detailedReview: "1Password's Secret Key adds an extra layer of protection that most competitors lack. Its Watchtower feature proactively alerts you to compromised passwords and security risks across your accounts."
    },
    {
      categoryId: hId,
      slug: "siteground",
      name: "SiteGround",
      logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/SiteGround_Logo.svg",
      rating: "4.7",
      price: "$2.99/mo",
      originalPrice: "$14.99/mo",
      discount: "80%",
      affiliateSlug: "siteground",
      badge: "🚀 Top Performance",
      shortDescription: "Premium hosting managed on Google Cloud with top-tier support.",
      features: ["Google Cloud Infrastructure", "Ultrafast PHP", "Free CDN", "Free SSL", "Daily Backups", "Managed WordPress"],
      pros: ["Exceptional uptime", "Superior customer support", "Advanced caching included", "Easy staging sites"],
      cons: ["Lower storage limits", "Renewal prices jump significantly"],
      bestFor: "Small to medium businesses that prioritize speed and expert support.",
      scores: { speed: 99, security: 95, value: 85, ease: 97 },
      detailedReview: "SiteGround is our top recommendation for serious websites. Built on Google Cloud, it offers unparalleled speed and a custom management interface that makes hosting simple for everyone."
    },
    {
      categoryId: vId,
      slug: "expressvpn",
      name: "ExpressVPN",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/22/ExpressVPN_logo.png",
      rating: "4.8",
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
      categoryId: vId,
      slug: "surfshark",
      name: "Surfshark",
      logo: "https://upload.wikimedia.org/wikipedia/commons/8/86/Surfshark_logo_2021.svg",
      rating: "4.7",
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
      scores: { speed: 90, security: 92, value: 99, ease: 88 },
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
