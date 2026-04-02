import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type CategoryResponse, type ProductResponse, type LinkBioDataResponse, type DashboardStatsResponse } from "@shared/routes";

// Categories
export function useCategories() {
  return useQuery({
    queryKey: [api.categories.list.path],
    queryFn: async () => {
      const res = await fetch(api.categories.list.path);
      if (!res.ok) throw new Error("Failed to fetch categories");
      return api.categories.list.responses[200].parse(await res.json());
    },
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: [api.categories.getBySlug.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.categories.getBySlug.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch category");
      return api.categories.getBySlug.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

// Products
export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: categorySlug 
      ? [api.products.getByCategory.path, categorySlug]
      : [api.products.list.path],
    queryFn: async () => {
      let url;
      if (categorySlug) {
        url = buildUrl(api.products.getByCategory.path, { slug: categorySlug });
      } else {
        url = api.products.list.path;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      
      const data = await res.json();
      return categorySlug 
        ? api.products.getByCategory.responses[200].parse(data)
        : api.products.list.responses[200].parse(data);
    },
    enabled: categorySlug !== "",
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: [api.products.getBySlug.path, slug],
    queryFn: async () => {
      const url = buildUrl(api.products.getBySlug.path, { slug });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      return api.products.getBySlug.responses[200].parse(await res.json());
    },
    enabled: !!slug,
  });
}

// Link in Bio
export function useLinkBio() {
  return useQuery({
    queryKey: [api.links.bio.path],
    queryFn: async () => {
      const res = await fetch(api.links.bio.path);
      if (!res.ok) throw new Error("Failed to fetch link in bio data");
      return api.links.bio.responses[200].parse(await res.json());
    },
  });
}

// Search
export function useSearch(query: string) {
  return useQuery({
    queryKey: ['/api/search', query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json() as Promise<Array<{ id: number; slug: string; name: string; logo: string; shortDescription: string; bestFor: string; rating: string; categorySlug: string; affiliateSlug: string }>>;
    },
    enabled: query.trim().length >= 2,
  });
}

// Dashboard Stats
export function useDashboardStats() {
  return useQuery({
    queryKey: [api.stats.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.stats.dashboard.path);
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return api.stats.dashboard.responses[200].parse(await res.json());
    },
  });
}
