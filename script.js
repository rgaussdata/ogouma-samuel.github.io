/* -------------------------
  UTILITAIRES : localStorage helpers
   - key names: projects, posts, chat_messages
--------------------------*/
const storage = {
  get(key, def = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : def;
    } catch (e) { return def; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

/* -------------------------
  PROJETS : affichage + ajout
--------------------------*/
function renderProjects() {
  const list = document.getElementById('projects-list');
  list.innerHTML = '';
  const projects = storage.get('projects', []);
  if (projects.length === 0) {
    list.innerHTML = '<p>Aucun projet pour le moment — ajoutez-en un ci-dessous.</p>';
    return;
  }
  projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `<h4>${escapeHtml(p.title)}</h4>
                      <p>${escapeHtml(p.desc)}</p>
                      ${p.link ? `<p><a href="${escapeHtml(p.link)}" target="_blank">Voir</a></p>` : ''}`;
    list.appendChild(card);
  });
}

document.getElementById('add-project-btn').addEventListener('click', () => {
  const title = document.getElementById('proj-title').value.trim();
  const link = document.getElementById('proj-link').value.trim();
  const desc = document.getElementById('proj-desc').value.trim();
  if (!title) return alert('Titre requis');
  const projects = storage.get('projects', []);
  projects.unshift({title, link, desc, created: Date.now()});
  storage.set('projects', projects);
  renderProjects();
  document.getElementById('proj-title').value = '';
  document.getElementById('proj-link').value = '';
  document.getElementById('proj-desc').value = '';
});

/* -------------------------
  BLOG POSTS : publication + affichage
--------------------------*/
function renderPosts() {
  const list = document.getElementById('posts-list');
  list.innerHTML = '';
  const posts = storage.get('posts', []);
  if (posts.length === 0) { list.innerHTML = '<p>Aucun post pour l’instant.</p>'; return; }
  posts.forEach(p => {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `<strong>${escapeHtml(p.title)}</strong>
                      <p style="font-size:0.9rem;color:#666">par ${escapeHtml(p.author)} — ${new Date(p.date).toLocaleString()}</p>
                      <div>${escapeHtml(p.body)}</div>`;
    list.appendChild(card);
  });
}

document.getElementById('add-post-btn').addEventListener('click', () => {
  const author = document.getElementById('post-author').value.trim() || 'Anonyme';
  const title = document.getElementById('post-title').value.trim() || '(Sans titre)';
  const body = document.getElementById('post-body').value.trim();
  if (!body) return alert('Écrire un message pour publier.');
  const posts = storage.get('posts', []);
  posts.unshift({author, title, body, date: Date.now()});
  storage.set('posts', posts);
  renderPosts();
  document.getElementById('post-author').value = '';
  document.getElementById('post-title').value = '';
  document.getElementById('post-body').value = '';
});

/* -------------------------
  CHAT VISITEURS : local messages
--------------------------*/
function renderChat() {
  const win = document.getElementById('chat-window');
  const msgs = storage.get('chat_messages', []);
  win.innerHTML = msgs.map(m => `<div style="margin-bottom:8px"><strong>${escapeHtml(m.name)}:</strong> ${escapeHtml(m.text)} <div style="font-size:0.8rem;color:#999">${new Date(m.date).toLocaleTimeString()}</div></div>`).join('');
  win.scrollTop = win.scrollHeight;
}

document.getElementById('send-chat-btn').addEventListener('click', () => {
  const name = document.getElementById('chat-name').value.trim() || 'Visiteur';
  const text = document.getElementById('chat-input').value.trim();
  if (!text) return;
  const msgs = storage.get('chat_messages', []);
  msgs.push({name, text, date: Date.now()});
  storage.set('chat_messages', msgs);
  document.getElementById('chat-input').value = '';
  renderChat();
});

document.getElementById('clear-chat-btn').addEventListener('click', () => {
  if (!confirm('Effacer le chat local ? (cela supprime seulement votre navigateur)')) return;
  storage.set('chat_messages', []);
  renderChat();
});

/* -------------------------
  CHATBOT SIMPLE (règles basées sur des mots clés)
--------------------------*/
function botRespond(q) {
  if (!q || !q.trim()) return 'Posez une question simple, par exemple : "Quels services proposes-tu ?"';
  const t = q.toLowerCase();

  // règles simples
  const rules = [
    {keys:['service','services','prestation','prestations','que fais'], ans:'Je propose : Analyse et conception de dashboards, mise en place de systèmes intelligents de supervision et des formations (Excel, Power BI, Python, R).'},
    {keys:['contact','email','tél','telephone','phone'], ans:'Contactez-moi par email à samuelogouma6@gmail.com ou via WhatsApp au +22890239957.'},
    {keys:['prix','tarif','coût','combien'], ans:'Les tarifs dépendent du périmètre. Envoyez un message avec votre besoin et je vous ferai un devis.'},
    {keys:['cv','cv','cv'], ans:'Vous pouvez télécharger mon CV depuis le bouton "Télécharger CV" en accueil (ou me demander par email).'},
    {keys:['projet','projets','réalisation','portfolio'], ans:'Rendez-vous à la section Projets pour voir et ajouter des réalisations.'},
    {keys:['horaire','heure','disponible'], ans:'Je suis disponible en semaine ; envoyez un email pour fixer un rendez-vous.'},
    {keys:['bonjour','salut','hello'], ans:'Bonjour ! En quoi puis-je vous aider aujourd’hui ?'}
  ];

  for (const r of rules) {
    if (r.keys.some(k => t.includes(k))) return r.ans;
  }

  // fallback : proposer contact ou poster question sur blog
  return "Désolé, je ne comprends pas parfaitement — vous pouvez poser la question différemment, consulter la section 'Services', ou m'envoyer un email.";
}

document.getElementById('ask-bot-btn').addEventListener('click', () => {
  const q = document.getElementById('bot-input').value.trim();
  const win = document.getElementById('bot-window');
  const existing = win.innerHTML;
  const userLine = `<div style="margin-bottom:8px"><strong>Vous:</strong> ${escapeHtml(q)}</div>`;
  const botLine = `<div style="margin-bottom:8px"><strong>Bot:</strong> ${escapeHtml(botRespond(q))}</div>`;
  win.innerHTML = existing + userLine + botLine;
  document.getElementById('bot-input').value = '';
  win.scrollTop = win.scrollHeight;
});

/* -------------------------
  CONTACT FORM (simulé)
--------------------------*/
document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Merci. Le message est simulé envoyé (local). Pour réception réelle, il faut configurer un formulaire backend ou un service tiers.');
  document.getElementById('contact-form').reset();
});

/* -------------------------
  INITIALISATION & helpers
--------------------------*/
function escapeHtml(str){
  if(!str) return '';
  return String(str)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

function init(){
  renderProjects();
  renderPosts();
  renderChat();
  // exemple : ajouter quelques projets si vide
  const projects = storage.get('projects', []);
  if (projects.length === 0) {
    projects.push(
      {title:'Supervision serveur national', desc:'Architecture & dashboard de supervision pour serveurs critiques', link:'', created:Date.now()},
      {title:'Dashboard énergétique', desc:'Power BI dashboard consolidation des données énergétiques', link:'', created:Date.now()-10000000}
    );
    storage.set('projects', projects);
    renderProjects();
  }
}

init();

/* -------------------------
  Téléchargement CV (simple simulation)
  - Remplace # ou configure un fichier CV à héberger
--------------------------*/
document.getElementById('download-cv').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Pour fournir un CV téléchargeable : placez le fichier CV (ex: cv-samuel.pdf) dans le dossier du site et modifiez le href du bouton vers ce fichier.');
});

