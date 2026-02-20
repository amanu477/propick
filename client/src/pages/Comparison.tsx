import { useParams, Link } from "wouter";
import { useProducts, useCategory } from "@/hooks/use-products";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Info, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Comparison() {
  const { slug } = useParams();
  const { data: category, isLoading: isLoadingCategory } = useCategory(slug || "");
  const { data: products, isLoading: isLoadingProducts } = useProducts(slug);

  // Sorting products by rating desc for rank
  const rankedProducts = products?.sort((a, b) => Number(b.rating) - Number(a.rating));
  const topPick = rankedProducts?.[0];

  if (isLoadingCategory || isLoadingProducts) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 w-full space-y-8">
          <Skeleton className="h-16 w-3/4 max-w-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!category || !rankedProducts) {
    return <div className="text-center py-20">Category not found</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Navbar />

      {/* Hero Header */}
      <header className="bg-white border-b border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold font-heading text-gray-900 mb-6">
            {category.title}
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed">
            {category.description}
          </p>
          <div className="mt-8 text-sm text-gray-400 flex items-center justify-center gap-2">
            <Info className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Quick Answer Box */}
            {topPick && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CheckCircle2 className="w-32 h-32 text-blue-600" />
                </div>
                
                <h2 className="text-blue-900 font-bold text-lg mb-2 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Quick Answer
                </h2>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  The Best {category.name} is <span className="text-blue-600">{topPick.name}</span>
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                  After extensive testing, {topPick.name} outperforms the competition with superior speed, unbreakable security, and the most intuitive interface we've tested.
                </p>
                <a 
                  href={`/go/${topPick.affiliateSlug}`}
                  target="_blank"
                  rel="nofollow noopener sponsored"
                  className="inline-block"
                >
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-1">
                    Get {topPick.name} Now
                  </button>
                </a>
              </motion.div>
            )}

            {/* Comparison Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold font-heading text-gray-900">Feature Comparison</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold">Product</th>
                      <th className="px-6 py-4 font-bold">Rating</th>
                      <th className="px-6 py-4 font-bold">Speed</th>
                      <th className="px-6 py-4 font-bold">Price</th>
                      <th className="px-6 py-4 font-bold">Best For</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rankedProducts.map((product, idx) => (
                      <tr 
                        key={product.id} 
                        className={`hover:bg-gray-50 transition-colors ${idx === 0 ? 'bg-yellow-50/30 border-l-4 border-l-warning' : ''}`}
                      >
                        <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                          <img src={product.logo} alt="" className="w-8 h-8 object-contain" />
                          {product.name}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-warning fill-warning" />
                            {product.rating}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{product.scores.speed}/10</td>
                        <td className="px-6 py-4 text-gray-600">{product.price}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.bestFor}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Cards List */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-heading text-gray-900">Detailed Reviews</h2>
              </div>
              
              {rankedProducts.map((product, index) => (
                <div key={product.id} id={product.slug} className="scroll-mt-24">
                  <ProductCard product={product} rank={index + 1} />
                </div>
              ))}
            </div>

            {/* Disclosure */}
            <div className="bg-gray-100 rounded-xl p-6 text-sm text-gray-500 flex gap-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>
                <strong>Affiliate Disclosure:</strong> We are reader-supported. When you buy through links on our site, we may earn an affiliate commission. This helps support our testing methodology.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="sticky top-24 space-y-8">
              {/* Table of Contents */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Table of Contents</h3>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#" className="text-blue-600 hover:underline">Quick Answer: Best Choice</a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-blue-600 hover:underline">Comparison Table</a>
                  </li>
                  {rankedProducts.map((p, i) => (
                    <li key={p.id}>
                      <a href={`#${p.slug}`} className="text-gray-600 hover:text-blue-600 hover:underline flex gap-2">
                        <span className="text-gray-400">#{i + 1}</span> {p.name} Review
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#" className="text-gray-600 hover:text-blue-600 hover:underline">Frequently Asked Questions</a>
                  </li>
                </ul>
              </div>

              {/* Newsletter */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white">
                <h3 className="font-bold text-lg mb-2">Stay Secure</h3>
                <p className="text-sm text-gray-300 mb-4">Get the latest security tips and exclusive deals delivered to your inbox.</p>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-400 mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-lg transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
