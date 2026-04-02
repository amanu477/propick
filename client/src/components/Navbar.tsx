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
      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img src={urls[idx]} alt={name} className="w-7 h-7 object-contain rounded-md shrink-0" onError={() => setIdx((i) => i + 1)} />
  );
}

function SearchField() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDebouncedQuery("");
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: results, isLoading } = useSearch(debouncedQuery);

  const handleSelect = (categorySlug: string, productSlug: string) => {
    navigate(`/best/${categorySlug}/${productSlug}`);
    setQuery("");
    setDebouncedQuery("");
  };

  const showDropdown = debouncedQuery.length >= 2;

  return (
    <div ref={wrapperRef} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="w-44 pl-8 pr-7 py-1.5 text-sm rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:w-56 transition-all duration-200"
        data-testid="input-global-search"
        onKeyDown={(e) => e.key === "Escape" && (setQuery(""), setDebouncedQuery(""))}
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setDebouncedQuery(""); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          data-testid="button-clear-search"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Results dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {isLoading && (
            <div className="px-4 py-5 text-center text-sm text-gray-400">Searching...</div>
          )}
          {!isLoading && results && results.length === 0 && (
            <div className="px-4 py-5 text-center text-sm text-gray-400">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}
          {!isLoading && results && results.length > 0 && (
            <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    onClick={() => handleSelect(result.categorySlug, result.slug)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group"
                    data-testid={`search-result-${result.id}`}
                  >
                    <ProductLogo src={result.logo} name={result.name} affiliateSlug={result.affiliateSlug} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 text-sm">{result.name}</span>
                        <span className="flex items-center gap-0.5 text-xs text-amber-500">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {result.rating}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{result.shortDescription}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0 group-hover:text-primary transition-colors" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: "Best VPNs", href: "/best/vpn" },
    { label: "Antivirus", href: "/best/antivirus" },
    { label: "Password Managers", href: "/best/password-manager" },
    { label: "Hosting", href: "/best/hosting" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold font-heading text-gray-900 tracking-tight">
              Pick<span className="text-primary">Vera</span>
            </span>
          </Link>

          {/* Desktop: nav links + always-visible search */}
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

            {/* Search always visible on the right */}
            <div className="ml-auto">
              <SearchField />
            </div>
          </div>

          {/* Mobile: hamburger only */}
          <div className="flex md:hidden items-center gap-1 ml-auto">
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

        {/* Mobile: search bar always visible below the nav row */}
        <div className="md:hidden pb-3">
          <SearchField />
        </div>
      </div>
    </nav>
  );
}
