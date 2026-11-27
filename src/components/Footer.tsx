import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Instagram } from './InstagramIcon';
import { LanguageSwitcher } from './LanguageSwitcher';
import { asset, useLang } from '../hooks/useLang';
import { INSTAGRAM_PROFILE } from '../features/instagram/instagram';

export function Footer() {
  const { t } = useTranslation();
  const { to } = useLang();
  return (
    <footer className="mt-24 border-t border-line bg-ink-2">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src={asset('brand/logo-256.webp')} alt="" width={56} height={56} className="h-14 w-14" />
            <div>
              <p className="font-display text-lg font-extrabold" dir="ltr">We Are Ben Arous</p>
              <p className="text-sm text-muted">{t('brand.slogan')}</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm text-muted">{t('about.independent')}</p>
        </div>
        <nav aria-label={t('nav.footerLabel')} className="flex flex-col gap-2 text-sm">
          <Link className="text-muted hover:text-white" to={to('explore')}>{t('nav.explore')}</Link>
          <Link className="text-muted hover:text-white" to={to('places')}>{t('nav.places')}</Link>
          <Link className="text-muted hover:text-white" to={to('stories')}>{t('nav.stories')}</Link>
          <Link className="text-muted hover:text-white" to={to('about')}>{t('nav.about')}</Link>
        </nav>
        <div className="flex flex-col gap-4">
          <p className="font-display text-sm font-bold">{t('footer.follow')}</p>
          <a href={INSTAGRAM_PROFILE} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-2 text-sm text-muted hover:text-white">
            <Instagram className="h-5 w-5 text-primary" aria-hidden /> <span dir="ltr">@we_are_ben_arous</span>
          </a>
          <LanguageSwitcher className="w-fit" />
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted sm:px-6">
          <p>
            © {new Date().getFullYear()} {t('footer.rights')} ·{' '}
            <Link to={`${to('about')}#credits`} className="underline-offset-2 hover:underline">{t('footer.credits')}</Link>
          </p>
          <Link to="/admin" className="hover:text-white">{t('footer.admin')}</Link>
        </div>
      </div>
    </footer>
  );
}
