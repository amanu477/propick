import { useLinkBio } from "@/hooks/use-products";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { ExternalLink, Star } from "lucide-react";

export default function LinkBio() {
  const { data: linkData, isLoading } = useLinkBio();

  // Custom loader
  if (isLoading) {
    return (
      <div className="min-h-screen link-bio-page flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen link-bio-page py-12 px-4">
      <div className="max-w-[480px] mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block relative"
          >
            <Avatar className="w-24 h-24 border-4 border-white/10 shadow-2xl">
              <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150" />
              <AvatarFallback>TG</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-green-500 w-6 h-6 rounded-full border-4 border-[#0f172a] flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </motion.div>
          
          <div>
            <h1 className="text-2xl font-bold font-heading">TrustGuide Picks</h1>
            <p className="text-gray-400 text-sm mt-1">Curated deals on software we actually use.</p>
          </div>
        </div>

        {/* Featured Deal Banner - Animated */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-black shadow-lg shadow-orange-500/20"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="font-black text-xs uppercase tracking-widest opacity-80 mb-1">Limited Time</div>
              <div className="font-bold text-lg">NordVPN 68% OFF + 3 Months Free</div>
            </div>
            <div className="bg-black/10 p-2 rounded-full">
              <Star className="w-6 h-6 text-black fill-black" />
            </div>
          </div>
          <a href="/go/nordvpn" className="absolute inset-0 z-20" />
        </motion.div>

        {/* Categories & Links */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {linkData?.map((section) => (
            <div key={section.category.id} className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">
                {section.category.title}
              </h2>
              
              <div className="space-y-3">
                {section.items.map((link) => (
                  <motion.a
                    key={link.id}
                    variants={item}
                    href={`/go/${link.slug}`}
                    target="_blank"
                    rel="nofollow noopener"
                    className={`
                      block relative overflow-hidden rounded-xl p-4 transition-all duration-200
                      ${link.isHot 
                        ? 'bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/50 hover:border-primary' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{link.emoji}</div>
                      <div className="flex-grow min-w-0">
                        <div className="font-semibold truncate text-white flex items-center gap-2">
                          {link.name}
                          {link.isHot && (
                            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                              Hot
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 truncate">{link.description}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <a href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
            Powered by TrustGuide
          </a>
        </div>
      </div>
    </div>
  );
}
