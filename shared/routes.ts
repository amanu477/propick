import { z } from 'zod';
import { 
  categories, 
  products, 
  affiliateLinks, 
  linkBioCategories, 
  linkBioItems 
} from './schema';

export const errorSchemas = {
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

// Zod schemas for the returned data
const productSchema = z.custom<typeof products.$inferSelect>();
const categorySchema = z.custom<typeof categories.$inferSelect>();
const linkBioCategorySchema = z.custom<typeof linkBioCategories.$inferSelect>();
const linkBioItemSchema = z.custom<typeof linkBioItems.$inferSelect>();

const linkBioDataSchema = z.object({
  category: linkBioCategorySchema,
  items: z.array(linkBioItemSchema),
});

const linkStatsSchema = z.object({
  slug: z.string(),
  totalClicks: z.number(),
  todayClicks: z.number(),
});

const dashboardStatsSchema = z.object({
  totalClicks: z.number(),
  todayClicks: z.number(),
  activeLinks: z.number(),
  estimatedRevenue: z.string(),
  linkStats: z.array(linkStatsSchema),
});

export const api = {
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: {
        200: z.array(categorySchema),
      },
    },
    getBySlug: {
      method: 'GET' as const,
      path: '/api/categories/:slug' as const,
      responses: {
        200: categorySchema,
        404: errorSchemas.notFound,
      },
    },
  },
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      responses: {
        200: z.array(productSchema),
      },
    },
    getByCategory: {
      method: 'GET' as const,
      path: '/api/categories/:slug/products' as const,
      responses: {
        200: z.array(productSchema),
        404: errorSchemas.notFound,
      },
    },
    getBySlug: {
      method: 'GET' as const,
      path: '/api/products/:slug' as const,
      responses: {
        200: productSchema,
        404: errorSchemas.notFound,
      },
    },
  },
  links: {
    bio: {
      method: 'GET' as const,
      path: '/api/links/bio' as const,
      responses: {
        200: z.array(linkBioDataSchema),
      },
    },
  },
  stats: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/stats/dashboard' as const,
      responses: {
        200: dashboardStatsSchema,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CategoryResponse = z.infer<typeof categorySchema>;
export type ProductResponse = z.infer<typeof productSchema>;
export type DashboardStatsResponse = z.infer<typeof dashboardStatsSchema>;
export type LinkBioDataResponse = z.infer<typeof linkBioDataSchema>;
