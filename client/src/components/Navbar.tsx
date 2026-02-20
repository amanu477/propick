import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, BarChart3, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold font-heading text-gray-900 tracking-tight">
              Trust<span className="text-primary">Guide</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive(item.href)
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-gray-600 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
             <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/links">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-primary/20 text-primary hover:bg-primary/5 hover:text-primary font-semibold"
              >
                Link in Bio
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
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
                  <div className="h-px bg-gray-100" />
                  <Link href="/links">
                    <Button 
                      onClick={() => setIsOpen(false)}
                      className="w-full justify-start" variant="outline"
                    >
                      View Link in Bio
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button 
                      onClick={() => setIsOpen(false)}
                      className="w-full justify-start" variant="ghost"
                    >
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
