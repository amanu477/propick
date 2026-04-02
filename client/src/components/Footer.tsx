import { ShieldCheck, Twitter, Facebook, Instagram, Github } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="space-y-4 col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="bg-primary p-1.5 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold font-heading text-white tracking-tight">
                Pro<span className="text-primary-400">Picks</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              We test and review software to help you make confident decisions. Our reviews are unbiased, thorough, and supported by our readers.
            </p>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-4 font-heading">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/best/vpn" className="hover:text-primary-400 transition-colors">VPN Services</Link></li>
              <li><Link href="/best/antivirus" className="hover:text-primary-400 transition-colors">Antivirus Software</Link></li>
              <li><Link href="/best/password-manager" className="hover:text-primary-400 transition-colors">Password Managers</Link></li>
              <li><Link href="/best/hosting" className="hover:text-primary-400 transition-colors">Web Hosting</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-4 font-heading">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary-400 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary-400 transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-4 font-heading">Connect</h4>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
            </div>
            <p className="text-xs text-gray-500">
              Disclosure: We may earn a commission when you click links on our site. This does not affect our reviews.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} PickVera. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
