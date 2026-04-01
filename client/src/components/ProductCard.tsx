import { useState } from "react";
import { ProductResponse } from "@shared/routes";
import { Check, X, ChevronRight, Star, ExternalLink, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: ProductResponse;
  rank: number;
}

const BRAND_COLORS = [
  "from-blue-500 to-blue-700",
  "from-indigo-500 to-indigo-700",
  "from-violet-500 to-violet-700",
  "from-sky-500 to-sky-700",
  "from-teal-500 to-teal-700",
  "from-emerald-500 to-emerald-700",
];

function ProductLogo({ src, name, rank, className = "" }: { src: string; name: string; rank: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const color = BRAND_COLORS[rank % BRAND_COLORS.length];

  if (failed || !src) {
    return (
      <div className={`bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white font-extrabold select-none ${className}`}>
        <span className="text-3xl">{name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`object-contain mix-blend-multiply ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

export function ProductCard({ product, rank }: ProductCardProps) {
  const isTopPick = rank === 1;

  const avgScore = ((product.scores.speed + product.scores.security + product.scores.value + product.scores.ease) / 4).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: rank * 0.1 }}
      className={`
        relative group rounded-2xl border transition-all duration-300
        ${isTopPick
          ? 'bg-white border-primary/20 shadow-xl shadow-primary/5 ring-1 ring-primary/10'
          : 'bg-white border-gray-100 shadow-sm hover:shadow-lg'
        }
      `}
    >
      {/* Rank Badge */}
      <div className={`
        absolute -left-3 top-6 w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-lg z-10
        ${isTopPick ? 'bg-warning text-warning-foreground' : 'bg-gray-100 text-gray-500'}
      `}>
        #{rank}
      </div>

      {isTopPick && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-warning text-warning-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
          <Trophy className="w-3 h-3" />
          Editor's Choice
        </div>
      )}

      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* Column 1: Logo & Rating */}
        <div className="md:col-span-3 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-full aspect-[3/2] bg-gray-50 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
            {product.badge && (
              <Badge variant="secondary" className="absolute top-2 right-2 text-[10px] bg-white shadow-sm z-10">
                {product.badge}
              </Badge>
            )}
            <ProductLogo
              src={product.logo}
              name={product.name}
              rank={rank}
              className="w-full h-full"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(Number(product.rating)) ? 'text-warning fill-warning' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <p className="text-sm font-semibold text-gray-700">{avgScore}<span className="text-gray-400 font-normal">/100 Overall</span></p>
          </div>

          <p className="text-xs text-gray-400">Read our detailed review</p>
        </div>

        {/* Column 2: Features & Details */}
        <div className="md:col-span-6 space-y-6">
          <div>
            <h3 className="text-2xl font-bold font-heading text-gray-900">{product.name}</h3>
            <p className="text-sm font-medium text-primary mt-1">{product.bestFor}</p>
          </div>

          <p className="text-gray-600 leading-relaxed text-sm">
            {product.shortDescription}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {product.features.slice(0, 4).map((feature, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <div className="mt-1 p-0.5 rounded-full bg-green-100">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                {feature}
              </div>
            ))}
          </div>

          {/* Score Bars */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {[
              { label: "Speed", value: product.scores.speed, color: "bg-blue-500" },
              { label: "Security", value: product.scores.security, color: "bg-indigo-500" },
              { label: "Value", value: product.scores.value, color: "bg-green-500" },
              { label: "Ease of Use", value: product.scores.ease, color: "bg-violet-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-gray-500">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Price & CTA */}
        <div className="md:col-span-3 flex flex-col items-center justify-center space-y-4 h-full border-l border-gray-100 pl-0 md:pl-8">
          <div className="text-center">
            <div className="text-gray-400 line-through text-sm font-medium">{product.originalPrice}</div>
            <div className="text-3xl font-bold font-heading text-gray-900">{product.price}</div>
            <div className="text-xs text-gray-500 font-medium">per month</div>
            <div className="mt-2 inline-block bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded">
              {product.discount} OFF
            </div>
          </div>

          <a
            href={`/go/${product.affiliateSlug}`}
            target="_blank"
            rel="nofollow noopener sponsored"
            className="w-full"
          >
            <Button className="w-full h-12 text-base font-bold shadow-lg shadow-green-500/20 bg-[#22c55e] hover:bg-[#16a34a] transition-all hover:-translate-y-0.5">
              Visit Site <ExternalLink className="w-4 h-4 ml-2 opacity-50" />
            </Button>
          </a>

          <div className="text-[10px] text-gray-400 text-center px-4">
            30-day money-back guarantee
          </div>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="border-t border-gray-100 p-6 bg-gray-50/50 rounded-b-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600" />
            </div>
            Pros
          </h4>
          <ul className="space-y-2">
            {product.pros.map((pro, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span> {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
              <X className="w-3 h-3 text-red-600" />
            </div>
            Cons
          </h4>
          <ul className="space-y-2">
            {product.cons.map((con, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span> {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
