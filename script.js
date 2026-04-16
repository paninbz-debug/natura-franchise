/* =====================================================
   NATURA FRANCHISE LANDING · INTERACTIONS
   ===================================================== */

(function(){
  'use strict';

  /* ---------- HEADER SCROLL ---------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---------- BURGER (mobile menu) ---------- */
  const burger = document.getElementById('burger');
  const nav = document.querySelector('.nav');
  if (burger) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('nav--open');
      burger.classList.toggle('burger--open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('nav--open');
      burger.classList.remove('burger--open');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- CALCULATOR ---------- */
  const FORMATS = {
    togo:   { inv: 2500000, revenue: 680000,  margin: 0.26 },
    cafe:   { inv: 5000000, revenue: 1500000, margin: 0.22 },
    bistro: { inv: 12000000, revenue: 3100000, margin: 0.20 }
  };

  const calcState = {
    format: 'cafe',
    city: 1.1,
    location: 1.0
  };

  const fmtFull = n => Math.round(n).toLocaleString('ru-RU').replace(/,/g,' ') + ' ₽';
  const fmtMln = n => {
    const m = n / 1000000;
    return '+' + (m >= 10 ? m.toFixed(1) : m.toFixed(1)).replace('.0','') + ' млн ₽';
  };

  const DEPOSIT_RATE = 0.16;

  const updateCalc = () => {
    const f = FORMATS[calcState.format];
    const mult = calcState.city * calcState.location;
    const inv = f.inv;
    const revenue = f.revenue * mult;
    const profit = revenue * f.margin;
    const payback = Math.max(1, Math.round(inv / profit));
    const total24 = profit * 24 - inv;
    const roi = Math.round((total24 / inv) * 100);
    // Deposit: compound-ish, 16% p.a. over 2 years on the same investment
    const deposit = inv * (Math.pow(1 + DEPOSIT_RATE, 2) - 1);

    const set = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = val;
    };
    set('[data-calc-investments]', fmtFull(inv));
    set('[data-calc-revenue]', fmtFull(revenue));
    set('[data-calc-profit]', fmtFull(profit));
    set('[data-calc-payback]', '≈ ' + payback + ' мес');
    set('[data-calc-roi]', (roi >= 0 ? '+' : '') + roi + '%');
    set('[data-calc-total]', fmtMln(total24));
    set('[data-calc-deposit]', fmtMln(deposit));

    // Update chart
    const chartArea = document.querySelector('[data-calc-chart-area]');
    const chartLine = document.querySelector('[data-calc-chart-line]');
    const chartBE = document.querySelector('[data-calc-chart-breakeven]');
    const breakevenLabel = document.querySelector('[data-calc-breakeven-label]');

    if (chartArea && chartLine && chartBE) {
      // Build 24 points
      const W = 400, H = 140;
      const maxValue = Math.max(total24, inv * 1.1);
      const minValue = -inv;
      const range = maxValue - minValue;
      const yFor = v => H - ((v - minValue) / range) * H;
      const xFor = m => (m / 24) * W;

      let pathL = '';
      for (let m = 0; m <= 24; m++) {
        const cum = profit * m - inv;
        const x = xFor(m);
        const y = yFor(cum);
        pathL += (m === 0 ? 'M' : ' L') + x.toFixed(1) + ',' + y.toFixed(1);
      }
      chartLine.setAttribute('d', pathL);

      // Area fill
      const lastX = xFor(24);
      const firstY = yFor(-inv);
      chartArea.setAttribute('d', pathL + ' L' + lastX + ',' + H + ' L0,' + H + ' Z');

      // Breakeven point
      if (payback <= 24) {
        const beX = xFor(payback);
        const beY = yFor(0);
        chartBE.setAttribute('cx', beX);
        chartBE.setAttribute('cy', beY);
        chartBE.style.display = '';
        if (breakevenLabel) breakevenLabel.textContent = 'Точка окупаемости: ~' + payback + ' мес';
      } else {
        chartBE.style.display = 'none';
        if (breakevenLabel) breakevenLabel.textContent = 'Окупаемость > 24 мес';
      }
    }
  };

  // Format tabs
  document.querySelectorAll('[data-calc-tabs] .calc__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-calc-tabs] .calc__tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      calcState.format = tab.dataset.value;
      updateCalc();
    });
  });

  // City radios
  document.querySelectorAll('[data-calc-city] input').forEach(radio => {
    radio.addEventListener('change', () => {
      calcState.city = parseFloat(radio.value);
      updateCalc();
    });
  });

  // Location toggle
  document.querySelectorAll('[data-calc-location] button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-calc-location] button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calcState.location = parseFloat(btn.dataset.value);
      updateCalc();
    });
  });

  updateCalc();

  /* ---------- QUIZ ---------- */
  const quizState = { step: 1, answers: {}, history: [] };
  const quizBar = document.getElementById('quizBar');
  const quizLabel = document.getElementById('quizLabel');
  const quizBack = document.getElementById('quizBack');

  const showStep = (step) => {
    document.querySelectorAll('.quiz__step').forEach(el => el.classList.remove('active'));
    const target = document.querySelector(`.quiz__step[data-step="${step}"]`);
    if (target) target.classList.add('active');
    quizState.step = step;

    // Progress
    const stepsMap = { '1':0, '2':20, '3':40, '4':60, '5':80, 'result':100 };
    const percent = stepsMap[step] !== undefined ? stepsMap[step] : 0;
    if (quizBar) quizBar.style.width = percent + '%';
    if (quizLabel) quizLabel.textContent = step === 'result' ? 'Результат' : (step + ' из 5');

    // Back button
    if (quizBack) quizBack.classList.toggle('visible', quizState.history.length > 0);
  };

  // Quiz logic to compute result
  const computeQuizResult = () => {
    const a = quizState.answers;
    // Decide format based on budget
    let format = 'cafe';
    const b = a.budget;
    if (b === '2.5') format = 'togo';
    else if (b === '5') format = a.exp === 'new' ? 'togo' : 'cafe';
    else if (b === '10') format = 'cafe';
    else if (b === '15') format = a.exp === 'new' ? 'cafe' : 'bistro';
    else if (b === '25') format = 'bistro';
    else if (b === 'unknown') format = 'cafe';

    // City multiplier
    const cityMap = { 'msk':1.3, 'mil':1.1, '500':1.0, '100':0.85, 'small':0.7, 'unknown':1.0 };
    const cityMult = cityMap[a.city] || 1.0;

    const f = FORMATS[format];
    const inv = f.inv;
    const revenue = f.revenue * cityMult;
    const profit = revenue * f.margin;
    const payback = Math.max(1, Math.round(inv / profit));

    const formatName = { togo:'TO-GO', cafe:'КОФЕЙНЯ', bistro:'БИСТРО' }[format];
    const invLabel = { togo:'от 2,5 млн ₽', cafe:'от 5 млн ₽', bistro:'от 12 млн ₽' }[format];

    const set = (sel, val) => {
      const el = document.querySelector(sel);
      if (el) el.textContent = val;
    };
    set('[data-result-format]', formatName);
    set('[data-result-inv]', invLabel);
    set('[data-result-profit]', 'от ' + Math.round(profit/1000) + ' тыс ₽');
    set('[data-result-payback]', '≈ ' + payback + ' месяцев');
  };

  document.querySelectorAll('.quiz__option').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const value = btn.dataset.value;
      const next = btn.dataset.next;
      if (key) quizState.answers[key] = value;
      quizState.history.push(quizState.step);
      if (next === 'result') computeQuizResult();
      showStep(next);
      // Scroll quiz into view smoothly
      document.getElementById('quiz').scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  if (quizBack) {
    quizBack.addEventListener('click', () => {
      if (quizState.history.length > 0) {
        const prev = quizState.history.pop();
        showStep(prev);
      }
    });
  }

  /* ---------- MODAL ---------- */
  const modal = document.getElementById('modal');
  const modalTitle = modal.querySelector('.modal__title');
  const modalLead  = modal.querySelector('.modal__lead');

  const CONTEXTS = {
    default: {
      title: 'Получите презентацию франшизы',
      lead: 'Пришлём PDF на email и свяжемся в течение часа в рабочее время.'
    },
    pdf: {
      title: 'Скачайте презентацию',
      lead: 'PDF на 18 страниц: форматы, финмодель, кейсы, процесс запуска. Придёт на email сразу.'
    },
    calc: {
      title: 'Детальная финмодель',
      lead: 'Отправим помесячный P&L на 24 месяца под ваш город и формат. Бесплатно.'
    },
    cases: {
      title: 'Все кейсы Natura',
      lead: 'Расшифровка P&L, помесячный анализ, фото каждой точки. Пришлём в PDF.'
    },
    meeting: {
      title: 'Кофе с основателями',
      lead: 'Назначим удобное время — онлайн или в Туле/Москве. Амик и Александр встретят лично.'
    },
    scarcity: {
      title: 'Бронь в программе 10 партнёров',
      lead: 'Осталось 8 из 10 мест. Зафиксируем −30% на паушальный и первоочерёдность выбора города.'
    },
    togo: {
      title: 'Формат TO-GO',
      lead: 'Компактная точка от 2,5 млн ₽. С учётом скидки программы — паушальный 350 000 ₽.'
    },
    cafe: {
      title: 'Формат КОФЕЙНЯ',
      lead: 'Основной формат от 5 млн ₽. С учётом скидки программы — паушальный 700 000 ₽.'
    },
    bistro: {
      title: 'Формат БИСТРО',
      lead: 'Флагманский формат от 12 млн ₽. С учётом скидки программы — паушальный 1 050 000 ₽.'
    }
  };

  const openModal = (ctx='default') => {
    const c = CONTEXTS[ctx] || CONTEXTS.default;
    modalTitle.textContent = c.title;
    modalLead.textContent = c.lead;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('[data-open-form]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const ctx = btn.dataset.context || btn.dataset.formatPick || 'default';
      openModal(ctx);
    });
  });

  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  /* ---------- FORMS → EMAIL (FormSubmit) + TELEGRAM ---------- */
  const toast = document.getElementById('toast');
  const showToast = () => {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  };

  // ---- CONFIG: Replace with your Telegram bot token & chat ID ----
  // 1) Create bot via @BotFather → get token
  // 2) Add bot to your channel/group → get chat_id
  // 3) Paste below
  const TG_BOT_TOKEN = '<REDACTED_REVOKED_2026_05_01>';
  const TG_CHAT_ID = '687941614';
  // ----------------------------------------------------------------

  const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/naturafranch@yandex.ru';

  // Human-readable labels for quiz answers
  const CITY_LABELS = { msk:'Москва/СПб', mil:'Миллионник', '500':'500тыс–1млн', '100':'100–500тыс', small:'до 100тыс', unknown:'Не определился' };
  const BUDGET_LABELS = { '2.5':'2,5–5 млн', '5':'5–10 млн', '10':'10–15 млн', '15':'15–25 млн', '25':'25+ млн', unknown:'Не определился' };
  const EXP_LABELS = { 'new':'Первый бизнес', other:'Опыт в другой сфере', horeca:'Опыт в HoReCa', investor:'Действующий предприниматель', multi:'Мультифранчайзи' };
  const TIME_LABELS = { hot:'Готов сейчас', '3m':'3 месяца', '6m':'6 месяцев', later:'Позже', research:'Изучает рынок' };
  const PRIORITY_LABELS = { roi:'Окупаемость', brand:'Надёжный бренд', support:'Сопровождение', concept:'Уникальная концепция', passive:'Пассивный доход' };

  const sendToTelegram = (data) => {
    if (!TG_BOT_TOKEN || !TG_CHAT_ID) return;

    const lines = [
      '🔔 *Новая заявка с сайта франшизы*',
      '',
      '👤 *Имя:* ' + (data.name || '—'),
      '📞 *Телефон:* ' + (data.phone || '—'),
    ];

    // Only show fields that have values
    if (data.email) lines.push('✉️ *Email:* ' + data.email);
    if (data.city) lines.push('🏙 *Город:* ' + data.city);
    if (data.budget) lines.push('💰 *Бюджет:* ' + data.budget);

    lines.push('');
    lines.push('📊 *Источник:* ' + (data._source_block || 'сайт') + '  |  *A/B:* ' + (data._ab_variant || '—'));

    if (data._quiz_format) {
      const a = quizState.answers;
      lines.push('');
      lines.push('📋 *Квиз:*');
      lines.push('  Формат: *' + data._quiz_format + '*');
      lines.push('  Город: ' + (CITY_LABELS[a.city] || a.city || '—'));
      lines.push('  Бюджет: ' + (BUDGET_LABELS[a.budget] || a.budget || '—'));
      lines.push('  Опыт: ' + (EXP_LABELS[a.exp] || a.exp || '—'));
      lines.push('  Сроки: ' + (TIME_LABELS[a.time] || a.time || '—'));
      lines.push('  Приоритет: ' + (PRIORITY_LABELS[a.priority] || a.priority || '—'));
    }

    const text = lines.join('\n');
    fetch('https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: text,
        parse_mode: 'Markdown'
      })
    }).catch(() => {});
  };

  const sendToEmail = (data) => {
    return fetch(FORMSUBMIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        city: data.city || '',
        budget: data.budget || '',
        _source: data._source_block || 'сайт',
        _quiz: data._quiz_format ? JSON.stringify(quizState.answers) : '',
        _subject: '🔔 Заявка на франшизу Natura — ' + (data.name || 'Новый лид'),
        _template: 'table'
      })
    }).catch(() => {});
  };

  const handleSubmit = form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const raw = Object.fromEntries(new FormData(form).entries());

      // Enrich data
      const data = {
        ...raw,
        _source_block: form.closest('.quiz__result') ? 'quiz' :
                       form.closest('.modal') ? 'modal' :
                       form.closest('.contact') ? 'final_form' : 'other',
        _ab_variant: document.cookie.match(/natura_ab=([AB])/)?.[1] || 'A',
        _page_url: window.location.href,
        _quiz_format: quizState.answers.budget ? (
          { togo:'TO-GO', cafe:'КОФЕЙНЯ', bistro:'БИСТРО' }[
            parseFloat(quizState.answers.budget) <= 5 ? 'togo' :
            parseFloat(quizState.answers.budget) <= 10 ? 'cafe' : 'bistro'
          ] || ''
        ) : '',
        _quiz_city: quizState.answers.city || '',
        _quiz_budget: quizState.answers.budget || '',
        _quiz_exp: quizState.answers.exp || '',
        _quiz_time: quizState.answers.time || '',
        _quiz_priority: quizState.answers.priority || '',
      };

      console.log('[Natura Lead]', data);

      // Send to both channels
      sendToEmail(data);
      sendToTelegram(data);

      form.reset();
      closeModal();
      showToast();
    });
  };

  document.querySelectorAll('form').forEach(handleSubmit);

  /* ---------- PHONE MASK ---------- */
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let f = '+7';
      if (v.length > 1) f += ' ' + v.slice(1, 4);
      if (v.length >= 5) f += ' ' + v.slice(4, 7);
      if (v.length >= 8) f += ' ' + v.slice(7, 9);
      if (v.length >= 10) f += ' ' + v.slice(9, 11);
      e.target.value = f;
    });
  });

  /* ---------- REVEAL ON SCROLL ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });

  document.querySelectorAll(
    '.format-card, .pillar, .why__item, .step, .case, .award, .faq__item, .section__head, .founder-card, .notfor__item, .scarcity__item'
  ).forEach(el => {
    el.classList.add('reveal');
    io.observe(el);
  });

  /* ---------- SMOOTH SCROLL ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id && id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        const target = document.querySelector(id);
        const offset = 100;
        window.scrollTo({
          top: target.offsetTop - offset,
          behavior: 'smooth'
        });
      }
    });
  });

  /* ---------- FAQ: close others ---------- */
  document.querySelectorAll('.faq__item').forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        document.querySelectorAll('.faq__item').forEach(other => {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---------- SCARCITY BAR: animate on scroll into view ---------- */
  const scarcityBar = document.querySelector('.scarcity__bar-fill');
  if (scarcityBar) {
    const target = scarcityBar.style.width;
    scarcityBar.style.width = '0%';
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => { scarcityBar.style.width = target; }, 200);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    observer.observe(scarcityBar);
  }

})();
