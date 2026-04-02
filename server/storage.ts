import { db } from "./db";
import {
  categories, products, affiliateLinks, clickLogs, linkBioCategories, linkBioItems, adminUsers, pendingProducts,
  type Category, type Product, type AffiliateLink, type ClickLog, type LinkBioCategory, type LinkBioItem, type AdminUser, type PendingProduct,
  type InsertCategory, type InsertProduct, type InsertAffiliateLink, type InsertClickLog, type InsertLinkBioCategory, type InsertLinkBioItem, type InsertAdminUser, type InsertPendingProduct
} from "@shared/schema";
import { eq, desc, asc, like, sql } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Products
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  fixProductLogos(): Promise<void>;

  // Affiliate Links
  getAffiliateLinks(): Promise<AffiliateLink[]>;
  getAffiliateLinkBySlug(slug: string): Promise<AffiliateLink | undefined>;
  getAffiliateLinkById(id: number): Promise<AffiliateLink | undefined>;
  createAffiliateLink(link: InsertAffiliateLink): Promise<AffiliateLink>;
  updateAffiliateLink(id: number, link: Partial<InsertAffiliateLink>): Promise<AffiliateLink>;
  deleteAffiliateLink(id: number): Promise<void>;

  // Click logs
  logClick(log: InsertClickLog): Promise<ClickLog>;
  getDashboardStats(): Promise<any>;

  // Link in Bio
  getLinkBioCategories(): Promise<LinkBioCategory[]>;
  getLinkBioItemsByCategory(categoryId: number): Promise<LinkBioItem[]>;
  getAllLinkBioItems(): Promise<LinkBioItem[]>;
  getLinkBioItemById(id: number): Promise<LinkBioItem | undefined>;
  getLinkBioCategoryById(id: number): Promise<LinkBioCategory | undefined>;
  createLinkBioCategory(category: InsertLinkBioCategory): Promise<LinkBioCategory>;
  updateLinkBioCategory(id: number, category: Partial<InsertLinkBioCategory>): Promise<LinkBioCategory>;
  deleteLinkBioCategory(id: number): Promise<void>;
  createLinkBioItem(item: InsertLinkBioItem): Promise<LinkBioItem>;
  updateLinkBioItem(id: number, item: Partial<InsertLinkBioItem>): Promise<LinkBioItem>;
  deleteLinkBioItem(id: number): Promise<void>;

  // Admin users
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminById(id: number): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;

  // Pending Products (n8n automation queue)
  getPendingProducts(status?: string): Promise<PendingProduct[]>;
  getPendingProductById(id: number): Promise<PendingProduct | undefined>;
  createPendingProduct(product: InsertPendingProduct): Promise<PendingProduct>;
  approvePendingProduct(id: number): Promise<Product>;
  rejectPendingProduct(id: number): Promise<void>;
  deletePendingProduct(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {

  // ─── Categories ────────────────────────────────────────────────────────────

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // ─── Products ──────────────────────────────────────────────────────────────

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async fixProductLogos(): Promise<void> {
    // Update all products that still use Wikipedia/other unreliable logo URLs
    // to use Clearbit based on their affiliate slug (e.g. "nordvpn" → logo.clearbit.com/nordvpn.com)
    await db.execute(
      sql`UPDATE products
          SET logo = 'https://logo.clearbit.com/' || affiliate_slug || '.com'
          WHERE logo LIKE '%wikipedia%'
             OR logo LIKE '%wikimedia%'`
    );
  }

  // ─── Affiliate Links ───────────────────────────────────────────────────────

  async getAffiliateLinks(): Promise<AffiliateLink[]> {
    return await db.select().from(affiliateLinks);
  }

  async getAffiliateLinkBySlug(slug: string): Promise<AffiliateLink | undefined> {
    const [link] = await db.select().from(affiliateLinks).where(eq(affiliateLinks.slug, slug));
    return link;
  }

  async getAffiliateLinkById(id: number): Promise<AffiliateLink | undefined> {
    const [link] = await db.select().from(affiliateLinks).where(eq(affiliateLinks.id, id));
    return link;
  }

  async createAffiliateLink(link: InsertAffiliateLink): Promise<AffiliateLink> {
    const [newLink] = await db.insert(affiliateLinks).values(link).returning();
    return newLink;
  }

  async updateAffiliateLink(id: number, link: Partial<InsertAffiliateLink>): Promise<AffiliateLink> {
    const [updated] = await db.update(affiliateLinks).set(link).where(eq(affiliateLinks.id, id)).returning();
    return updated;
  }

  async deleteAffiliateLink(id: number): Promise<void> {
    await db.delete(affiliateLinks).where(eq(affiliateLinks.id, id));
  }

  // ─── Click Logs & Stats ────────────────────────────────────────────────────

  async logClick(log: InsertClickLog): Promise<ClickLog> {
    const [newLog] = await db.insert(clickLogs).values(log).returning();
    return newLog;
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const allClicks = await db.select().from(clickLogs);
    const todayClicks = allClicks.filter(c => c.date === today);
    const links = await db.select().from(affiliateLinks);
    const allProducts = await db.select().from(products);

    const productByAffiliateSlug = new Map<string, { name: string; logo: string }>();
    allProducts.forEach(p => {
      productByAffiliateSlug.set(p.affiliateSlug, { name: p.name, logo: p.logo });
    });

    const statsBySlug = new Map<string, { total: number, today: number }>();
    allClicks.forEach(c => {
      const current = statsBySlug.get(c.slug) || { total: 0, today: 0 };
      current.total += 1;
      if (c.date === today) current.today += 1;
      statsBySlug.set(c.slug, current);
    });

    const linkStats = Array.from(statsBySlug.entries()).map(([slug, stats]) => {
      const product = productByAffiliateSlug.get(slug);
      return {
        slug,
        totalClicks: stats.total,
        todayClicks: stats.today,
        productName: product?.name,
        productLogo: product?.logo,
      };
    }).sort((a, b) => b.totalClicks - a.totalClicks);

    const estimatedRev = (allClicks.length * 0.05).toFixed(2);

    return {
      totalClicks: allClicks.length,
      todayClicks: todayClicks.length,
      activeLinks: links.length,
      estimatedRevenue: `$${estimatedRev}`,
      linkStats,
    };
  }

  // ─── Link in Bio ───────────────────────────────────────────────────────────

  async getLinkBioCategories(): Promise<LinkBioCategory[]> {
    return await db.select().from(linkBioCategories).orderBy(asc(linkBioCategories.sortOrder));
  }

  async getLinkBioCategoryById(id: number): Promise<LinkBioCategory | undefined> {
    const [cat] = await db.select().from(linkBioCategories).where(eq(linkBioCategories.id, id));
    return cat;
  }

  async getLinkBioItemsByCategory(categoryId: number): Promise<LinkBioItem[]> {
    return await db.select().from(linkBioItems)
      .where(eq(linkBioItems.categoryId, categoryId))
      .orderBy(asc(linkBioItems.sortOrder));
  }

  async getAllLinkBioItems(): Promise<LinkBioItem[]> {
    return await db.select().from(linkBioItems).orderBy(asc(linkBioItems.sortOrder));
  }

  async getLinkBioItemById(id: number): Promise<LinkBioItem | undefined> {
    const [item] = await db.select().from(linkBioItems).where(eq(linkBioItems.id, id));
    return item;
  }

  async createLinkBioCategory(category: InsertLinkBioCategory): Promise<LinkBioCategory> {
    const [newCategory] = await db.insert(linkBioCategories).values(category).returning();
    return newCategory;
  }

  async updateLinkBioCategory(id: number, category: Partial<InsertLinkBioCategory>): Promise<LinkBioCategory> {
    const [updated] = await db.update(linkBioCategories).set(category).where(eq(linkBioCategories.id, id)).returning();
    return updated;
  }

  async deleteLinkBioCategory(id: number): Promise<void> {
    await db.delete(linkBioCategories).where(eq(linkBioCategories.id, id));
  }

  async createLinkBioItem(item: InsertLinkBioItem): Promise<LinkBioItem> {
    const [newItem] = await db.insert(linkBioItems).values(item).returning();
    return newItem;
  }

  async updateLinkBioItem(id: number, item: Partial<InsertLinkBioItem>): Promise<LinkBioItem> {
    const [updated] = await db.update(linkBioItems).set(item).where(eq(linkBioItems.id, id)).returning();
    return updated;
  }

  async deleteLinkBioItem(id: number): Promise<void> {
    await db.delete(linkBioItems).where(eq(linkBioItems.id, id));
  }

  // ─── Admin Users ───────────────────────────────────────────────────────────

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async getAdminById(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const [newUser] = await db.insert(adminUsers).values(user).returning();
    return newUser;
  }

  // ─── Pending Products ──────────────────────────────────────────────────────

  async getPendingProducts(status?: string): Promise<PendingProduct[]> {
    const all = await db.select().from(pendingProducts).orderBy(desc(pendingProducts.createdAt));
    return status ? all.filter(p => p.status === status) : all;
  }

  async getPendingProductById(id: number): Promise<PendingProduct | undefined> {
    const [p] = await db.select().from(pendingProducts).where(eq(pendingProducts.id, id));
    return p;
  }

  async createPendingProduct(product: InsertPendingProduct): Promise<PendingProduct> {
    const [newPending] = await db.insert(pendingProducts).values(product).returning();
    return newPending;
  }

  async approvePendingProduct(id: number): Promise<Product> {
    const pending = await this.getPendingProductById(id);
    if (!pending) throw new Error("Pending product not found");

    const existingLink = await this.getAffiliateLinkBySlug(pending.affiliateSlug);
    if (!existingLink) {
      await this.createAffiliateLink({
        slug: pending.affiliateSlug,
        url: pending.affiliateUrl || `https://example.com/aff/${pending.affiliateSlug}`,
        program: pending.affiliateProgram || `${pending.name} Partners`,
        commission: pending.commission,
        cookieDays: pending.cookieDays,
      });
    }

    let slug = pending.slug;
    const existingProduct = await this.getProductBySlug(slug);
    if (existingProduct) slug = `${slug}-${Date.now()}`;

    const product = await this.createProduct({
      categoryId: pending.categoryId,
      slug,
      name: pending.name,
      logo: pending.logo,
      rating: pending.rating,
      price: pending.price,
      originalPrice: pending.originalPrice,
      discount: pending.discount,
      affiliateSlug: pending.affiliateSlug,
      badge: pending.badge,
      shortDescription: pending.shortDescription,
      features: pending.features as string[],
      pros: pending.pros as string[],
      cons: pending.cons as string[],
      bestFor: pending.bestFor,
      scores: pending.scores as { speed: number; security: number; value: number; ease: number },
      detailedReview: pending.detailedReview,
    });

    await db.update(pendingProducts).set({ status: "approved" }).where(eq(pendingProducts.id, id));
    return product;
  }

  async rejectPendingProduct(id: number): Promise<void> {
    await db.update(pendingProducts).set({ status: "rejected" }).where(eq(pendingProducts.id, id));
  }

  async deletePendingProduct(id: number): Promise<void> {
    await db.delete(pendingProducts).where(eq(pendingProducts.id, id));
  }
}

export const storage = new DatabaseStorage();
