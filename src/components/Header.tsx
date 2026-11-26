import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { asset, useLang } from '../hooks/useLang';

export function Header() {
  const { t } = useTranslation();
  const { to } = useLang();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const links = [
    { href: to('explore'), label: t('nav.explore') },
    { href: to('places'), label: t('nav.places') },
    { href: to('stories'), label: t('nav.stories') },
    { href: to('about'), label: t('nav.about') },
  ];
  const cls = ({ isActive }: { isActive: boolean }) =>
    `font-display text-sm font-semibold transition hover:text-white ${isActive ? 'text-white underline decoration-primary decoration-2 underline-offset-8' : 'text-muted'}`;
  return (
    <header className="sticky top-0 z-[1000] border-b border-line/60 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to={to()} className="flex items-center gap-2.5" aria-label={t('nav.home')}>
          <img src={asset('brand/logo-256.webp')} alt="" width={40} height={40} className="h-10 w-10" />
          <span className="font-display text-base font-extrabold tracking-tight" dir="ltr">We Are <span className="text-primary">Ben Arous</span></span>
        </Link>
        <nav aria-label="Main" className="ms-auto hidden items-center gap-7 md:flex">
          {links.map((l) => <NavLink key={l.href} to={l.href} className={cls}>{l.label}</NavLink>)}
        </nav>
        <LanguageSwitcher className="ms-auto hidden md:flex md:ms-0" />
        <button type="button" className="ms-auto grid h-11 w-11 place-items-center rounded-full border border-line md:hidden"
          aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? t('nav.close') : t('nav.menu')} onClick={() => setOpen((o) => !o)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-line bg-ink px-4 pb-6 pt-2 md:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}><NavLink to={l.href} className={({ isActive }) => `block py-3 font-display text-lg font-bold ${isActive ? 'text-primary' : 'text-white'}`}>{l.label}</NavLink></li>
            ))}
          </ul>
          <LanguageSwitcher className="mt-4 w-fit" />
        </nav>
      )}
    </header>
  );
}
