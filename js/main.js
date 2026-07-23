/* ============================================================
   DUMARCHÉ PAYSAGE — Interactions & animations GSAP
   ============================================================ */
document.documentElement.classList.remove('no-js');

/* ---------- Header : fond au scroll ---------- */
const header = document.querySelector('.site-header');
const onScroll = () => {
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ---------- Menu mobile ---------- */
const burger = document.querySelector('.nav__burger');
const links = document.querySelector('.nav__links');
if (burger) {
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => { burger.classList.remove('open'); links.classList.remove('open'); })
  );
}

/* ---------- Animations GSAP ---------- */
if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger);

  // Hero d'accueil : entrée en séquence
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .from('.hero__eyebrow', { y: 24, opacity: 0, duration: .7 })
    .from('.hero h1', { y: 40, opacity: 0, duration: .9 }, '-=.4')
    .from('.hero__sub', { y: 26, opacity: 0, duration: .8 }, '-=.55')
    .from('.hero__actions .btn', { y: 22, opacity: 0, duration: .6, stagger: .12 }, '-=.5')
    .from('.hero__scroll', { opacity: 0, duration: .8 }, '-=.2');

  // Hero pages internes
  gsap.from('.hero-page .breadcrumb, .hero-page h1, .hero-page p', {
    y: 30, opacity: 0, duration: .8, stagger: .12, ease: 'power3.out', delay: .15
  });

  // Effet parallaxe sur les médias de hero
  gsap.utils.toArray('.hero__media, .hero-page__media').forEach(media => {
    gsap.to(media, {
      yPercent: 18, ease: 'none',
      scrollTrigger: { trigger: media.closest('.hero, .hero-page'), start: 'top top', end: 'bottom top', scrub: true }
    });
  });

  // Reveal générique
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.set(el, { y: 40, opacity: 0 });
    gsap.to(el, {
      opacity: 1, y: 0, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Reveal en groupe (stagger) pour les grilles
  gsap.utils.toArray('[data-stagger]').forEach(group => {
    const items = group.children;
    gsap.set(items, { y: 46, opacity: 0 });
    gsap.to(items, {
      y: 0, opacity: 1, duration: .8, ease: 'power3.out', stagger: .12,
      scrollTrigger: { trigger: group, start: 'top 82%' }
    });
  });

  // Compteurs de statistiques
  gsap.utils.toArray('.stat__num[data-count]').forEach(num => {
    const target = parseFloat(num.dataset.count);
    const suffix = num.dataset.suffix || '';
    const obj = { val: 0 };
    ScrollTrigger.create({
      trigger: num, start: 'top 88%', once: true,
      onEnter: () => gsap.to(obj, {
        val: target, duration: 1.6, ease: 'power2.out',
        onUpdate: () => { num.textContent = Math.round(obj.val) + suffix; }
      })
    });
  });
}

/* ---------- Avant / Après : slider ---------- */
document.querySelectorAll('.ba-slider').forEach(slider => {
  const after = slider.querySelector('.ba-slider__after');
  const handle = slider.querySelector('.ba-slider__handle');
  let dragging = false;

  const setPos = clientX => {
    const rect = slider.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    after.style.clipPath = `inset(0 0 0 ${pct}%)`;
    handle.style.left = pct + '%';
  };
  const start = () => dragging = true;
  const stop = () => dragging = false;
  const move = e => { if (!dragging) return; setPos(e.touches ? e.touches[0].clientX : e.clientX); };

  handle.addEventListener('mousedown', start);
  handle.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('mouseup', stop);
  window.addEventListener('touchend', stop);
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: true });
  slider.addEventListener('click', e => { if (e.target === handle) return; setPos(e.clientX); });
});

/* ---------- Formulaire Rendez-vous (fonctionnel) ---------- */
const rdvForm = document.getElementById('rdv-form');
if (rdvForm) {
  // date minimale = aujourd'hui
  const dateInput = rdvForm.querySelector('#date');
  if (dateInput) {
    const today = new Date();
    today.setDate(today.getDate() + 1); // au plus tôt : demain
    dateInput.min = today.toISOString().split('T')[0];
  }

  const showError = (field, on) => field.closest('.field').classList.toggle('error', on);

  // Adresse de réception des demandes de rendez-vous
  const DEST_EMAIL = 'clement.bach09@gmail.com';

  rdvForm.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;

    // champs requis
    rdvForm.querySelectorAll('[required]').forEach(input => {
      const empty = !input.value.trim();
      showError(input, empty);
      if (empty) valid = false;
    });

    // email
    const email = rdvForm.querySelector('#email');
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      showError(email, true); valid = false;
    }
    // téléphone (chiffres, espaces, +, -)
    const tel = rdvForm.querySelector('#tel');
    if (tel && tel.value && !/^[0-9+\s.\-]{8,}$/.test(tel.value)) {
      showError(tel, true); valid = false;
    }
    // au moins une prestation
    const prestaChecked = rdvForm.querySelectorAll('input[name="prestation"]:checked').length > 0;
    const prestaGroup = rdvForm.querySelector('.pills');
    if (prestaGroup) prestaGroup.closest('.field').classList.toggle('error', !prestaChecked);
    if (!prestaChecked) valid = false;

    if (!valid) {
      const firstErr = rdvForm.querySelector('.field.error');
      if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Données du formulaire
    const data = new FormData(rdvForm);
    const prestations = data.getAll('prestation').join(', ');
    const nom = data.get('nom');
    const dateStr = new Date(data.get('date')).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Corps du message lisible
    const body =
`Bonjour Louis,

Je souhaite prendre rendez-vous pour : ${prestations}.

Nom : ${nom}
Téléphone : ${data.get('tel')}
Email : ${data.get('email')}
Adresse : ${data.get('adresse') || '(non précisée)'}
Date souhaitée : ${dateStr}
Créneau : ${data.get('creneau') || '(indifférent)'}

Message :
${data.get('message') || '(aucun)'}`;

    // Lien mailto de secours (pré-rempli)
    const mailto = `mailto:${DEST_EMAIL}?subject=${encodeURIComponent('Demande de RDV — ' + nom)}&body=${encodeURIComponent(body)}`;
    const success = document.getElementById('form-success');
    const mailLink = success.querySelector('.recap-mail');
    if (mailLink) mailLink.href = mailto;
    success.querySelector('.recap-name').textContent = nom;
    success.querySelector('.recap-details').textContent =
      `${prestations} — souhait : ${dateStr}${data.get('creneau') ? ' (' + data.get('creneau') + ')' : ''}`;

    // Bouton en état "envoi en cours"
    const submitBtn = rdvForm.querySelector('button[type="submit"]');
    const btnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.style.opacity = '.7';
    submitBtn.innerHTML = 'Envoi en cours…';

    // Envoi réel vers l'adresse via FormSubmit (aucun compte requis)
    const payload = {
      _subject: 'Nouvelle demande de RDV — ' + nom,
      Prestation: prestations,
      Nom: nom,
      Téléphone: data.get('tel'),
      Email: data.get('email'),
      Adresse: data.get('adresse') || '(non précisée)',
      'Date souhaitée': dateStr,
      Créneau: data.get('creneau') || '(indifférent)',
      Message: data.get('message') || '(aucun)',
      _template: 'table',
      _replyto: data.get('email')
    };

    const showSuccess = () => {
      rdvForm.style.display = 'none';
      success.classList.add('show');
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (window.gsap) gsap.from(success, { y: 20, opacity: 0, duration: .6, ease: 'power3.out' });
    };

    try {
      const res = await fetch('https://formsubmit.co/ajax/' + DEST_EMAIL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showSuccess();
    } catch (err) {
      // Repli : on affiche quand même la confirmation avec le bouton email pré-rempli
      console.warn('Envoi automatique indisponible, repli sur mailto.', err);
      showSuccess();
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      submitBtn.innerHTML = btnHtml;
    }
  });

  // retirer l'erreur en corrigeant
  rdvForm.querySelectorAll('input, select, textarea').forEach(input =>
    input.addEventListener('input', () => input.closest('.field')?.classList.remove('error'))
  );
}

/* ---------- Année du footer ---------- */
document.querySelectorAll('.year').forEach(el => el.textContent = new Date().getFullYear());
