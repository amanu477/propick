import { db } from "./db";
import {
  categories, products, affiliateLinks, clickLogs, linkBioCategories, linkBioItems,
  type Category, type Product, type AffiliateLink, type ClickLog, type LinkBioCategory, type LinkBioItem,
  type InsertCategory, type InsertProduct, type InsertAffiliateLink, type InsertClickLog, type InsertLinkBioCategory, type InsertLinkBioItem
} from "@shared/schema";
import { eq, desc, asc, and, sql } from "drizzle-orm";

export interface IStorage {
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  getAffiliateLinkBySlug(slug: string): Promise<AffiliateLink | undefined>;
  createAffiliateLink(link: InsertAffiliateLink): Promise<AffiliateLink>;

  logClick(log: InsertClickLog): Promise<ClickLog>;
  getDashboardStats(): Promise<any>;

  getLinkBioCategories(): Promise<LinkBioCategory[]>;
  getLinkBioItemsByCategory(categoryId: number): Promise<LinkBioItem[]>;
  createLinkBioCategory(category: InsertLinkBioCategory): Promise<LinkBioCategory>;
  createLinkBioItem(item: InsertLinkBioItem): Promise<LinkBioItem>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

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

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getAffiliateLinkBySlug(slug: string): Promise<AffiliateLink | undefined> {
    const [link] = await db.select().from(affiliateLinks).where(eq(affiliateLinks.slug, slug));
    return link;
  }

  async createAffiliateLink(link: InsertAffiliateLink): Promise<AffiliateLink> {
    const [newLink] = await db.insert(affiliateLinks).values(link).returning();
    return newLink;
  }

  async logClick(log: InsertClickLog): Promise<ClickLog> {
    const [newLog] = await db.insert(clickLogs).values(log).returning();
    return newLog;
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all clicks
    const allClicks = await db.select().from(clickLogs);
    
    // Get today's clicks
    const todayClicks = allClicks.filter(c => c.date === today);
    
    // Get active links
    const links = await db.select().from(affiliateLinks);
    
    // Calculate stats by slug
    const statsBySlug = new Map<string, { total: number, today: number }>();
    
    allClicks.forEach(c => {
      const current = statsBySlug.get(c.slug) || { total: 0, today: 0 };
      current.total += 1;
      if (c.date === today) {
        current.today += 1;
      }
      statsBySlug.set(c.slug, current);
    });
    
    const linkStats = Array.from(statsBySlug.entries()).map(([slug, stats]) => ({
      slug,
      totalClicks: stats.total,
      todayClicks: stats.today
    }));
    
    // Estimate revenue (assuming $5 average commission per 100 clicks)
    const estimatedRev = (allClicks.length * 0.05).toFixed(2);
    
    return {
      totalClicks: allClicks.length,
      todayClicks: todayClicks.length,
      activeLinks: links.length,
      estimatedRevenue: `$${estimatedRev}`,
      linkStats
    };
  }

  async getLinkBioCategories(): Promise<LinkBioCategory[]> {
    return await db.select().from(linkBioCategories).orderBy(asc(linkBioCategories.sortOrder));
  }

  async getLinkBioItemsByCategory(categoryId: number): Promise<LinkBioItem[]> {
    return await db.select().from(linkBioItems)
      .where(eq(linkBioItems.categoryId, categoryId))
      .orderBy(asc(linkBioItems.sortOrder));
  }

  async createLinkBioCategory(category: InsertLinkBioCategory): Promise<LinkBioCategory> {
    const [newCategory] = await db.insert(linkBioCategories).values(category).returning();
    return newCategory;
  }

  async createLinkBioItem(item: InsertLinkBioItem): Promise<LinkBioItem> {
    const [newItem] = await db.insert(linkBioItems).values(item).returning();
    return newItem;
  }
}

export const storage = new DatabaseStorage();
