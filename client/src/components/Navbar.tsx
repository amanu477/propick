import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, ShieldCheck, Search, X, Star, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSearch } from "@/hooks/use-products";

function ProductLogo({ src, name, affiliateSlug }: { src: string; name: string; affiliateSlug: string }) {
  const [idx, setIdx] = useState(0);
  const urls: string[] = [];
  if (src) urls.push(src);
  const domain = affiliateSlug ? `${affiliateSlug}.com` : null;
  if (domain) {
    if (!src?.includes("clearbit")) urls.push(`https://logo.clearbit.com/${domain}`);
    urls.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }

  if (idx >= urls.length) {
    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={urls[idx]}
      alt={name}
      className="w-8 h-8 object-contain rounded-lg shrink-0"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading } = useSearch(debouncedQuery);

  const handleSelect = (categorySlug: string, productSlug: string) => {
    navigate(`/best/${categorySlug}/${productSlug}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Search panel — drops below the navbar */}
      <div className="absolute top-full left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-xl">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, VPNs, antivirus, password managers..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              data-testid="input-global-search"
              onKeyDown={(e) => e.key === "Escape" && onClose()}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results */}
          {debouncedQuery.length >= 2 && (
            <div className="mt-2 rounded-xl border border-gray-100 overflow-hidden bg-white">
              {isLoading && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Searching...</div>
              )}
              {!isLoading && results && results.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No products found for &ldquo;{debouncedQuery}&rdquo;
                </div>
              )}
              {!isLoading && results && results.length > 0 && (
                <ul className="divide-y divide-gray-50">
                  {results.map((result) => (
                    <li key={result.id}>
                      <button
                        onClick={() => handleSelect(result.categorySlug, result.slug)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                        data-testid={`search-result-${result.id}`}
                      >
                        <ProductLogo src={result.logo} name={result.name} affiliateSlug={result.affiliateSlug} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{result.name}</span>
                            <span className="flex items-center gap-0.5 text-xs text-amber-500 font-medium">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {result.rating}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{result.shortDescription}</p>
                        </div>
                        <span className="text-xs text-gray-400 capitalize shrink-0 group-hover:text-primary transition-colors flex items-center gap-1">
                          {result.categorySlug.replace(/-/g, " ")}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {debouncedQuery.length < 2 && (
            <p className="mt-3 text-xs text-gray-400 text-center">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navItems = [
    { label: "Best VPNs", href: "/best/vpn" },
    { label: "Antivirus", href: "/best/antivirus" },
    { label: "Password Managers", href: "/best/password-manager" },
    { label: "Hosting", href: "/best/hosting" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex items-center h-16 gap-10">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold font-heading text-gray-900 tracking-tight">
              Pick<span className="text-primary">Vera</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
                    isActive(item.href)
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-gray-600 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            ))}

            {/* Search icon — far right */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((v) => !v)}
              className={cn("ml-auto rounded-full", searchOpen && "bg-gray-100")}
              data-testid="button-open-search"
            >
              {searchOpen
                ? <X className="w-5 h-5 text-gray-600" />
                : <Search className="w-5 h-5 text-gray-500" />}
            </Button>
          </div>

          {/* Mobile: search icon + hamburger */}
          <div className="flex md:hidden items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((v) => !v)}
              className={cn("rounded-full", searchOpen && "bg-gray-100")}
              data-testid="button-mobile-search"
            >
              {searchOpen
                ? <X className="w-5 h-5 text-gray-700" />
                : <Search className="w-5 h-5 text-gray-700" />}
            </Button>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col space-y-6 mt-8">
                  <div className="flex flex-col space-y-2">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <span
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "block px-4 py-3 rounded-lg text-base font-medium transition-colors cursor-pointer",
                            isActive(item.href)
                              ? "bg-primary/10 text-primary"
                              : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Search overlay — drops below navbar on both desktop and mobile */}
        {searchOpen && (
          <SearchOverlay onClose={() => setSearchOpen(false)} />
        )}
      </div>
    </nav>
  );
}
