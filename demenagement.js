// ─── DÉMÉNAGEMENT DE L'APPLICATION ──────────────────────────────────────────
// Actif uniquement si la variable d'environnement REDIRECT_TO est définie
// (à mettre UNIQUEMENT sur l'ancien service Render).
//  - Les pages (/, /index.html, /dashboard.html) affichent « L'application a déménagé »
//  - /sw.js est remplacé par un service worker qui vide le cache et recharge l'appli,
//    pour que les téléphones voient la nouvelle page au lieu de l'ancienne version en cache
//  - Les appels /api/* continuent de fonctionner normalement (aucune donnée perdue)

module.exports = function demenagement(app) {
  const cible = (process.env.REDIRECT_TO || '').replace(/\/+$/, '');
  if (!cible) return;

  console.log(`📦 Mode déménagement actif → ${cible}`);

  const SW_NETTOYAGE = `// sorteurpro - demenagement
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => c.navigate(c.url).catch(() => {}));
  })());
});
`;

  const PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SorteurPro a déménagé</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f2f5f3; color: #1d2b24;
         min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .carte { background: #fff; border-radius: 16px; padding: 28px 22px; max-width: 440px; width: 100%;
           box-shadow: 0 4px 20px rgba(0,0,0,.08); text-align: center; }
  h1 { font-size: 1.5rem; margin: 0 0 8px; }
  p { line-height: 1.45; margin: 0 0 16px; }
  .bouton { display: block; background: #1f8a4c; color: #fff; text-decoration: none; font-weight: 700;
            font-size: 1.2rem; padding: 18px; border-radius: 12px; margin: 20px 0; }
  ol { text-align: left; padding-left: 20px; line-height: 1.5; margin: 0 0 12px; }
  .etapes { background: #f6f8f7; border-radius: 12px; padding: 14px 16px; text-align: left; font-size: .95rem; }
  .etapes h2 { font-size: 1rem; margin: 0 0 8px; }
  .petit { font-size: .85rem; color: #5b6b63; margin-top: 14px; }
</style>
</head>
<body>
<div class="carte">
  <h1>📦 SorteurPro a déménagé</h1>
  <p>L'application a une nouvelle adresse. Cette ancienne version ne sera bientôt plus disponible.</p>

  <a class="bouton" href="${cible}/">Ouvrir la nouvelle application</a>

  <div class="etapes">
    <h2>Ensuite, installe-la sur ton téléphone :</h2>
    <ol>
      <li>Une fois la nouvelle application ouverte dans le navigateur :</li>
      <li><b>Android (Chrome)</b> : menu <b>⋮</b> → <b>Ajouter à l'écran d'accueil</b> (ou <b>Installer l'application</b>)</li>
      <li><b>iPhone (Safari)</b> : bouton <b>Partager</b> → <b>Sur l'écran d'accueil</b></li>
      <li>Supprime l'ancienne icône SorteurPro de ton écran d'accueil.</li>
    </ol>
  </div>
  <p class="petit">Nouvelle adresse : ${cible}</p>
</div>
<script>
  // Nettoie l'ancienne version (cache + service worker) de ce téléphone
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister())).catch(() => {});
  }
  if (window.caches) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
  }
</script>
</body>
</html>`;

  const pasDeCache = res => res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  app.get('/sw.js', (req, res) => {
    pasDeCache(res);
    res.type('application/javascript').send(SW_NETTOYAGE);
  });

  app.get(['/', '/index.html', '/dashboard.html'], (req, res) => {
    pasDeCache(res);
    res.type('html').send(PAGE);
  });
};
