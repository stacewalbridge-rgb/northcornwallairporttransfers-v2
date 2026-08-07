(()=>{
  const C=window.SITE_CONFIG||{};
  const phone=(C.phoneLink||'447356070904').replace(/\D/g,'');
  const display=C.phoneDisplay||'07356 070904';
  const email=C.email||'info@northcornwallairporttransfers.co.uk';

  document.querySelectorAll('[data-phone-link]:not([data-email-link])').forEach(a=>{
    a.href='tel:+'+phone;
    if(!a.textContent.trim() || !a.textContent.includes('Call')) a.textContent=display;
  });
  document.querySelectorAll('[data-whatsapp]').forEach(a=>{
    a.href='https://wa.me/'+phone+'?text='+encodeURIComponent('Hello, I would like a transfer quotation.');
  });
  document.querySelectorAll('[data-email-link]').forEach(a=>{
    a.href='mailto:'+email;
    a.textContent=email;
  });
  document.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());

  const button=document.querySelector('.nav-toggle');
  const menu=document.querySelector('.menu');
  if(button&&menu){
    button.setAttribute('aria-expanded','false');
    button.addEventListener('click',()=>{
      const open=menu.classList.toggle('open');
      button.setAttribute('aria-expanded',String(open));
      button.textContent=open?'Close':'Menu';
      document.body.classList.toggle('menu-open',open);
    });
    menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      menu.classList.remove('open');
      button.setAttribute('aria-expanded','false');
      button.textContent='Menu';
      document.body.classList.remove('menu-open');
    }));
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){
        menu.classList.remove('open');
        button.setAttribute('aria-expanded','false');
        button.textContent='Menu';
        document.body.classList.remove('menu-open');
      }
    });
  }

  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(x=>x.hidden=true);
    btn.classList.add('active');
    const panel=document.getElementById(btn.dataset.tab);
    if(panel) panel.hidden=false;
  }));


  // V30: quote actions — external script so CSP allows it.
  const quoteForm=document.getElementById('quote-form');
  if(quoteForm){
    const dateField=quoteForm.querySelector('input[type="date"]');
    if(dateField) dateField.min=new Date().toISOString().split('T')[0];

    const BUSINESS_PHONE_INT='447356070904';
    const BUSINESS_EMAIL='info@northcornwallairporttransfers.co.uk';

    const qValue=(name)=>{
      const field=quoteForm.elements[name];
      return field ? String(field.value||'').trim() : '';
    };

    const buildQuoteMessage=()=>{
      const lines=[
        'Hello North Cornwall Airport Transfers,',
        '',
        'I would like a transfer quote.',
        '',
        'Pickup: '+(qValue('pickup')||'Not entered'),
        'Destination: '+(qValue('destination')||'Not entered'),
        'Date: '+(qValue('date')||'Not entered'),
        'Time: '+(qValue('time')||'Not entered'),
        'Passengers: '+(qValue('passengers')||'Not entered'),
        'Large cases: '+(qValue('luggage')||'Not entered')
      ];

      if(qValue('name')) lines.push('Name: '+qValue('name'));
      if(qValue('phone')) lines.push('Telephone: '+qValue('phone'));
      if(qValue('email')) lines.push('Email: '+qValue('email'));
      if(qValue('details')) lines.push('Details: '+qValue('details'));

      lines.push('', 'Please let me know the price and availability. Thank you.');
      return lines.join('\n');
    };

    const validateQuote=()=>{
      const needed=['pickup','destination','date','time'];
      const missing=needed.find(name=>!qValue(name));
      const status=quoteForm.querySelector('.form-status');

      if(missing){
        if(status) status.textContent='Please enter your pickup, destination, date and time first.';
        const field=quoteForm.elements[missing];
        if(field){
          field.focus();
          field.scrollIntoView({behavior:'smooth',block:'center'});
        }
        return false;
      }

      if(status) status.textContent='';
      return true;
    };

    quoteForm.addEventListener('click',(event)=>{
      const button=event.target.closest('[data-quote-action]');
      if(!button || !quoteForm.contains(button)) return;

      event.preventDefault();
      if(!validateQuote()) return;

      const message=buildQuoteMessage();
      const action=button.getAttribute('data-quote-action');

      if(action==='whatsapp'){
        // Same-tab navigation is more reliable on mobile than window.open().
        window.location.assign(
          'https://wa.me/'+BUSINESS_PHONE_INT+'?text='+encodeURIComponent(message)
        );
        return;
      }

      if(action==='email'){
        window.location.href=
          'mailto:'+BUSINESS_EMAIL+
          '?subject='+encodeURIComponent('Transfer quote request')+
          '&body='+encodeURIComponent(message);
        return;
      }

      if(action==='sms'){
        const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
        const separator=isiOS?'&':'?';
        window.location.href=
          'sms:+'+BUSINESS_PHONE_INT+
          separator+'body='+encodeURIComponent(message);
      }
    });

    quoteForm.addEventListener('submit',(event)=>event.preventDefault());
  }

  // V30: close the native mobile menu when tapping outside it.
  const nativeMenu=document.getElementById('p28-menu');
  if(nativeMenu){
    document.addEventListener('click',(event)=>{
      if(nativeMenu.open && !nativeMenu.contains(event.target)){
        nativeMenu.removeAttribute('open');
      }
    });
    document.addEventListener('keydown',(event)=>{
      if(event.key==='Escape') nativeMenu.removeAttribute('open');
    });
    window.addEventListener('resize',()=>{
      if(window.innerWidth>850) nativeMenu.removeAttribute('open');
    });
  }

  let deferred;
  const box=document.querySelector('#install-app');
  const installButton=document.querySelector('#install-button');
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferred=e;
    if(box) box.classList.add('show');
  });
  if(installButton) installButton.addEventListener('click',async()=>{
    if(!deferred)return;
    deferred.prompt();
    await deferred.userChoice;
    deferred=null;
    if(box) box.classList.remove('show');
  });

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js?v=launch1').catch(()=>{}));
  }
})();