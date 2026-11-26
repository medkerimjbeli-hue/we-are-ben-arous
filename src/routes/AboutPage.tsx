import { useTranslation } from 'react-i18next';
import { asset } from '../hooks/useLang';
import { Seo } from '../components/Seo';

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <Seo title={t('about.title')} description={t('about.body1')} />
      <img src={asset('brand/logo-256.webp')} alt="We Are Ben Arous" width={128} height={128} className="mb-8 h-28 w-28" />
      <h1 className="text-4xl font-extrabold sm:text-5xl">{t('about.title')}</h1>
      <div className="mt-8 space-y-5 text-lg leading-relaxed text-white/90">
        <p>{t('about.body1')}</p><p>{t('about.body2')}</p><p>{t('about.body3')}</p>
      </div>
      <p className="mt-8 rounded-2xl border border-line p-4 text-sm text-muted">{t('about.independent')}</p>

      <h2 className="mb-4 mt-14 text-2xl font-extrabold">{t('home.missionTitle')}</h2>
      <p className="font-display text-xl font-bold text-primary">{t('brand.mission')}</p>
      <p className="mt-3 text-muted">{t('home.missionBody')}</p>
      <h2 className="mb-4 mt-10 text-2xl font-extrabold">{t('home.visionTitle')}</h2>
      <p className="text-muted">{t('home.visionBody')}</p>

      <h2 className="mb-4 mt-10 text-2xl font-extrabold">{t('about.aims')}</h2>
      <ul className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => <li key={i} className="flex gap-3"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden /><span>{t(`about.aim${i}`)}</span></li>)}
      </ul>

      <section id="credits" className="card mt-14 scroll-mt-24 p-6">
        <h2 className="mb-3 text-2xl font-extrabold">{t('about.creditsTitle')}</h2>
        <p className="text-muted">{t('about.creditsBody')}</p>
        <p className="mt-3 text-sm font-semibold" dir="ltr">Map data © OpenStreetMap contributors · Map Tunisia by Alaa Taieb</p>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <li><a className="underline decoration-primary underline-offset-4" href="https://github.com/Alaa-Taieb/map-tunisia" target="_blank" rel="noopener noreferrer">Map Tunisia</a></li>
          <li><a className="underline decoration-primary underline-offset-4" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">{t('about.osmCopyright')}</a></li>
          <li><a className="underline decoration-primary underline-offset-4" href={asset('geo/LICENSE-DATA.md')} target="_blank" rel="noopener noreferrer">{t('about.licenseLink')}</a></li>
          <li><a className="underline decoration-primary underline-offset-4" href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener noreferrer">ODbL 1.0</a></li>
        </ul>
        <p className="mt-4 text-sm text-muted">{t('about.instaCredits')}</p>
      </section>
    </div>
  );
}
