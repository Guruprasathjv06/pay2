'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ShoppingCart, LayoutDashboard, BarChart3, Clock, History, FileCode2, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenIntegrations: () => void;
}

export function Navbar({ onOpenIntegrations }: NavbarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Overview', icon: ShieldCheck },
    { href: '/checkout', label: 'Buyer Checkout', icon: ShoppingCart },
    { href: '/dashboard', label: 'Seller Dashboard', icon: LayoutDashboard },
    { href: '/analytics', label: 'AG Grid Analytics', icon: BarChart3 },
    { href: '/timeline', label: 'Bryntum Timeline', icon: Clock },
    { href: '/audit', label: 'Audit Trail', icon: History },
    { href: '/api-docs', label: 'API Docs', icon: FileCode2 },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Proofloop</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                  Demo
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-none">Agreed • Paid • Tracked</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Action / Sponsor status */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenIntegrations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Sponsor Tech</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav scrollbar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 gap-1 border-t border-slate-100 bg-slate-50">
        {navLinks.map(link => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap ${
                isActive ? 'bg-blue-600 text-white font-medium' : 'text-slate-600 bg-white border border-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
