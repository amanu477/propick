import { useCategories } from "@/hooks/use-products";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Globe, Lock, Cpu, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";

export default function Home() {
  const { data: categories, isLoading } = useCategories();

  useSEO({
    title: "Best VPNs, Antivirus & Password Managers",
    description: "Expert reviews, head-to-head comparisons, and unbiased rankings of the best VPNs, antivirus software, password managers, and web hosting providers.",
    url: window.location.origin,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ProPicks",
      url: window.location.origin,
      description: "Expert reviews and rankings of the best digital security software.",
      potentialAction: {
        "@type": "SearchAction",
        target: `${window.location.origin}/best/{search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  });

  const features = [
    { icon: Shield, title: "Unbiased Reviews", text: "We test every product rigorously to ensure our ratings are 100% honest." },
    { icon: Globe, title: "Global Testing", text: "Speed and performance tests conducted from multiple locations worldwide." },
    { icon: Lock, title: "Security First", text: "We prioritize security and privacy features in every software assessment." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
          {/* Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80')] bg-cover bg-center" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
          
          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-6xl font-extrabold text-white font-heading tracking-tight mb-6 leading-tight">
                Find the Best Tools <br className="hidden sm:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  For Your Digital Safety
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-xl text-gray-300 mb-10 leading-relaxed">
                Expert reviews, head-to-head comparisons, and unbiased rankings of the best VPNs, antivirus software, and password managers.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/best/vpn">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                    Browse Reviews <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white">
                    Our Methodology
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-heading text-gray-900">Explore Categories</h2>
              <p className="mt-4 text-gray-600">Start your search with our most popular software categories.</p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories?.map((category, index) => (
                  <Link key={category.id} href={`/best/${category.slug}`}>
                    <motion.div 
                      whileHover={{ y: -8 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:shadow-primary/10 border border-gray-100 cursor-pointer h-full flex flex-col"
                    >
                      <div className="w-14 h-14 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        {/* Dynamic icon mapping would happen here, using placeholder for now */}
                        {category.slug === 'vpn' ? <Globe className="w-7 h-7" /> : 
                         category.slug === 'antivirus' ? <Shield className="w-7 h-7" /> : 
                         <Cpu className="w-7 h-7" />}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h3>
                      <p className="text-gray-600 mb-6 flex-grow">{category.description}</p>
                      <div className="flex items-center text-primary font-semibold group-hover:translate-x-1 transition-transform">
                        Compare Now <ArrowRight className="ml-2 w-4 h-4" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Why Trust Us */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold font-heading text-gray-900 mb-6">Why ProPicks?</h2>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                  We don't just aggregate specs. We purchase, install, and rigorously test every piece of software we review. Our team of security experts spends hundreds of hours validating claims, testing speeds, and verifying no-logs policies.
                </p>
                
                <div className="space-y-6">
                  {features.map((feature, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{feature.title}</h4>
                        <p className="text-gray-600">{feature.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-green-100 rounded-3xl transform rotate-3 opacity-50" />
                <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">4.9/5 Rating</div>
                      <div className="text-gray-500">Average accuracy score</div>
                    </div>
                  </div>
                  
                  {/* Placeholder for "Featured In" logos */}
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Featured In</p>
                  <div className="grid grid-cols-3 gap-8 opacity-50 grayscale">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
