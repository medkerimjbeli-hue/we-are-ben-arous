import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Play } from 'lucide-react';
import { Instagram } from '../../components/InstagramIcon';
import type { SocialPost } from '../../types';
import { parseInstagramUrl } from './instagram';

declare global { interface Window { instgrm?: { Embeds: { process: () => void } } } }

let scriptPromise: Promise<void> | null = null;
function loadEmbedScript(): Promise<void> {
  if (window.instgrm) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://www.instagram.com/embed.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('embed.js failed')); };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/**
 * Instagram post/Reel card. The official embed is loaded only on request (privacy + performance).
 * If the embed fails or the post is unavailable, the fallback card keeps the supplied label and original link.
 */
export function InstagramEmbed({ post, subtitle }: { post: SocialPost; subtitle?: string }) {
  const { t } = useTranslation();
  const parsed = parseInstagramUrl(post.url);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state !== 'loading' || !parsed) return;
    let done = false;
    loadEmbedScript().then(() => {
      window.instgrm?.Embeds.process();
      const iv = setInterval(() => {
        if (box.current?.querySelector('iframe')) { done = true; clearInterval(iv); setState('ready'); }
      }, 300);
      setTimeout(() => { clearInterval(iv); if (!done) setState('failed'); }, 10000);
    }).catch(() => setState('failed'));
  }, [state, parsed]);

  const typeLabel = parsed ? t(`insta.${parsed.type}`) : 'Instagram';
  const link = (
    <a href={post.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white underline decoration-primary decoration-2 underline-offset-4 hover:text-primary">
      {t('common.viewOnInstagram')} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </a>
  );

  return (
    <article className="card flex flex-col overflow-hidden">
      {state === 'loading' || state === 'ready' ? (
        <div ref={box} className="min-h-[420px] bg-white/5 p-2 [&_iframe]:!min-w-0 [&_iframe]:!max-w-full">
          <blockquote className="instagram-media" data-instgrm-permalink={parsed!.permalink} data-instgrm-version="14"
            style={{ background: '#fff', border: 0, borderRadius: 12, margin: 0, width: '100%', minWidth: 0 }}>
            <a href={post.url} target="_blank" rel="noopener noreferrer">{post.label}</a>
          </blockquote>
        </div>
      ) : (
        <div className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-gradient-to-br from-accent/60 via-ink-3 to-ink p-6 text-center">
          <div aria-hidden className="absolute -end-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative">
            <span className="chip mb-4 border-white/20 text-white"><Instagram className="h-3.5 w-3.5" aria-hidden /> {typeLabel}</span>
            <p className="font-display text-2xl font-extrabold" dir="auto">{post.label}</p>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            {state === 'failed' || !parsed ? (
              <p role="status" className="mt-5 text-sm text-muted">{t('insta.unavailable')}</p>
            ) : (
              <>
                <button type="button" onClick={() => setState('loading')} className="btn btn-primary mt-6">
                  <Play className="h-4 w-4" aria-hidden /> {t('insta.load')}
                </button>
                <p className="mt-3 text-xs text-muted">{t('insta.privacy')}</p>
              </>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <span className="truncate text-sm text-muted" dir="auto">{post.label}</span>
        {link}
      </div>
    </article>
  );
}
