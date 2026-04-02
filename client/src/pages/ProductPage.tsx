import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSEO } from "@/hooks/use-seo";
import { ChevronRight, AlertCircle } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function ProductPage() {
  const { categorySlug, productSlug } = useParams<{ categorySlug: string; productSlug: string }>();

  const { data: product, isLoading: loadingProduct } = useQuery<Product>({
    queryKey: ["/api/products", productSlug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productSlug}`);
      if (!res.ok) throw new Error("Product not found");
      return res.json();
    },
    enabled: !!productSlug,
  });

  const { data: category, isLoading: loadingCategory } = useQuery<Category>({
    queryKey: ["/api/categories", categorySlug],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${categorySlug}`);
      if (!res.ok) throw new Error("Category not found");
      return res.json();
    },
    enabled: !!categorySlug,
  });

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ["/api/categories", categorySlug, "products"],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${categorySlug}/products`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!categorySlug,
  });

  const rank = allProducts
    ? [...allProducts]
        .sort((a, b) => {
          const avg = (p: Product) => (p.scores.speed + p.scores.security + p.scores.value + p.scores.ease) / 4;
          return avg(b) - avg(a);
        })
        .findIndex((p) => p.slug === productSlug) + 1
    : 1;

  const jsonLd = product && category
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.shortDescription,
        image: product.logo,
        brand: { "@type": "Brand", name: product.name },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: product.price.replace(/[^0-9.]/g, "") || "0",
          availability: "https://schema.org/InStock",
          url: `${window.location.origin}/go/${product.affiliateSlug}`,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          bestRating: "5",
          worstRating: "1",
          ratingCount: "1",
        },
        review: {
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: product.rating,
            bestRating: "5",
          },
          author: { "@type": "Organization", name: "PickVera" },
          reviewBody: product.detailedReview,
        },
      }
    : undefined;

  useSEO({
    title: product
      ? `${product.name} Review ${new Date().getFullYear()} — Is It Worth It?`
      : "Product Review",
    description: product
      ? `Expert ${product.name} review: ${product.shortDescription} Price: ${product.price}. Pros, cons, and our verdict.`
      : "Read our in-depth product review.",
    url: `${window.location.origin}/best/${categorySlug}/${productSlug}`,
    image: product?.logo,
    type: "article",
    jsonLd,
  });

  const isLoading = loadingProduct || loadingCategory;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 w-full space-y-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product || !category) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center text-center px-4 py-20">
          <div>
            <p className="text-2xl font-bold text-gray-900 mb-2">Product not found</p>
            <p className="text-gray-500 mb-6">This product may have been removed or the URL is incorrect.</p>
            <Link href={`/best/${categorySlug}`}>
              <span className="text-blue-600 hover:underline">← Back to {categorySlug} reviews</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navbar />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/"><span className="hover:text-blue-600 cursor-pointer">Home</span></Link>
            <ChevronRight className="w-4 h-4" />
            <Link href={`/best/${categorySlug}`}><span className="hover:text-blue-600 cursor-pointer">{category.name}</span></Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold font-heading text-gray-900 mb-3">
            {product.name} Review ({new Date().getFullYear()})
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">{product.shortDescription}</p>
        </div>

        <ProductCard product={product} rank={rank || 1} />

        {product.detailedReview && (
          <div className="mt-10 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-bold font-heading text-gray-900 mb-4">Our In-Depth {product.name} Review</h2>
            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed space-y-4">
              {product.detailedReview.split("\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-gray-100 rounded-xl p-6 text-sm text-gray-500 flex gap-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>
            <strong>Affiliate Disclosure:</strong> We may earn a commission when you purchase through our links. This does not affect our editorial independence or review scores.
          </p>
        </div>

        <div className="mt-8">
          <Link href={`/best/${categorySlug}`}>
            <span className="text-blue-600 hover:underline text-sm font-medium cursor-pointer">← Compare all {category.name} products</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
