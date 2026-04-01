import { pgTable, text, serial, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logo: text("logo").notNull(),
  rating: text("rating").notNull(),
  price: text("price").notNull(),
  originalPrice: text("original_price").notNull(),
  discount: text("discount").notNull(),
  affiliateSlug: text("affiliate_slug").notNull(),
  badge: text("badge"),
  shortDescription: text("short_description").notNull(),
  features: jsonb("features").notNull().$type<string[]>(),
  pros: jsonb("pros").notNull().$type<string[]>(),
  cons: jsonb("cons").notNull().$type<string[]>(),
  bestFor: text("best_for").notNull(),
  scores: jsonb("scores").notNull().$type<{ speed: number; security: number; value: number; ease: number }>(),
  detailedReview: text("detailed_review").notNull(),
});

export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  url: text("url").notNull(),
  program: text("program").notNull(),
  commission: text("commission").notNull(),
  cookieDays: integer("cookie_days").notNull(),
});

export const clickLogs = pgTable("click_logs", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  date: text("date").notNull(),
  userAgent: text("user_agent"),
  referer: text("referer"),
  country: text("country"),
});

export const linkBioCategories = pgTable("link_bio_categories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const linkBioItems = pgTable("link_bio_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  slug: text("slug").notNull(),
  emoji: text("emoji").notNull(),
  isHot: boolean("is_hot").default(false).notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pendingProducts = pgTable("pending_products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  logo: text("logo").notNull().default(""),
  rating: text("rating").notNull().default("4.5"),
  price: text("price").notNull().default("N/A"),
  originalPrice: text("original_price").notNull().default("N/A"),
  discount: text("discount").notNull().default("0%"),
  affiliateSlug: text("affiliate_slug").notNull(),
  affiliateUrl: text("affiliate_url").notNull().default(""),
  affiliateProgram: text("affiliate_program").notNull().default(""),
  commission: text("commission").notNull().default("0%"),
  cookieDays: integer("cookie_days").notNull().default(30),
  badge: text("badge"),
  shortDescription: text("short_description").notNull().default(""),
  features: jsonb("features").notNull().$type<string[]>().default([]),
  pros: jsonb("pros").notNull().$type<string[]>().default([]),
  cons: jsonb("cons").notNull().$type<string[]>().default([]),
  bestFor: text("best_for").notNull().default(""),
  scores: jsonb("scores").notNull().$type<{ speed: number; security: number; value: number; ease: number }>().default({ speed: 85, security: 85, value: 85, ease: 85 }),
  detailedReview: text("detailed_review").notNull().default(""),
  status: text("status").notNull().default("pending"),
  source: text("source").notNull().default("n8n"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("pending_products_status_idx").on(table.status)]);

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({ id: true });
export const insertClickLogSchema = createInsertSchema(clickLogs).omit({ id: true, timestamp: true });
export const insertLinkBioCategorySchema = createInsertSchema(linkBioCategories).omit({ id: true });
export const insertLinkBioItemSchema = createInsertSchema(linkBioItems).omit({ id: true });
export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true });
export const insertPendingProductSchema = createInsertSchema(pendingProducts).omit({ id: true, createdAt: true });

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type ClickLog = typeof clickLogs.$inferSelect;
export type LinkBioCategory = typeof linkBioCategories.$inferSelect;
export type LinkBioItem = typeof linkBioItems.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type PendingProduct = typeof pendingProducts.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type InsertClickLog = z.infer<typeof insertClickLogSchema>;
export type InsertLinkBioCategory = z.infer<typeof insertLinkBioCategorySchema>;
export type InsertLinkBioItem = z.infer<typeof insertLinkBioItemSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type InsertPendingProduct = z.infer<typeof insertPendingProductSchema>;

export interface LinkStats {
  slug: string;
  totalClicks: number;
  todayClicks: number;
  productName?: string;
  productLogo?: string;
}

export interface DashboardStats {
  totalClicks: number;
  todayClicks: number;
  activeLinks: number;
  estimatedRevenue: string;
  linkStats: LinkStats[];
}

export interface LinkBioData {
  category: LinkBioCategory;
  items: LinkBioItem[];
}
