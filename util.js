
import { dictionaries } from './i18n.js';

export function getLang(){
  const url = new URL(window.location.href);
  return url.searchParams.get('lang') || localStorage.getItem('lang') || 'cs';
}
export function setLang(lang){ localStorage.setItem('lang', lang); const url = new URL(window.location.href); url.searchParams.set('lang', lang); window.location.replace(url.toString()); }

export function getCurrency(){ return localStorage.getItem('currency') || (getLang()==='cs'?'CZK':'EUR'); }
export function setCurrency(c){ localStorage.setItem('currency', c); window.location.reload(); }

export function currency(v){
  const cur = getCurrency();
  const locale = (getLang()==='cs') ? 'cs-CZ' : 'en-US';
  const opts = { style:'currency', currency: cur, maximumFractionDigits: 0 };
  try { return new Intl.NumberFormat(locale, opts).format(v); } catch(e){ return v; }
}

export function formatDate(ts){
  const d = (ts instanceof Date) ? ts : new Date(ts);
  const locale = (getLang()==='cs') ? 'cs-CZ' : 'en-US';
  return new Intl.DateTimeFormat(locale, {dateStyle:'medium', timeStyle:'short'}).format(d);
}

export function t(key){
  const lang = getLang();
  const dict = dictionaries[lang] || dictionaries.en;
  return dict[key] || key;
}
