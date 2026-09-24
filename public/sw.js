// Service worker mínimo (PROJECT.md F10).
//
// Propósito único: dar ao navegador um worker ativo com um handler de
// "fetch", que é o que várias plataformas exigem para oferecer o prompt de
// instalação. Não cacheia páginas nem dados do Supabase — o app é
// renderizado no servidor com dado ao vivo, e cachear isso errado seria
// pior do que não cachear nada. Só o ícone e o manifesto (assets estáticos,
// sem dado de usuário) recebem cache-first.

const CACHE = "glicemia-shell-v1";
const ARQUIVOS_ESTATICOS = ["/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARQUIVOS_ESTATICOS)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  if (!ARQUIVOS_ESTATICOS.some((caminho) => evento.request.url.endsWith(caminho))) {
    return; // deixa passar direto para a rede — páginas e dados nunca são cacheados aqui
  }

  evento.respondWith(
    caches.match(evento.request).then((resposta) => resposta ?? fetch(evento.request)),
  );
});
