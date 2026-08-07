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

  const form=document.querySelector('#quote-form');
  if(form){
    const date=form.querySelector('input[type="date"]');
    if(date) date.min=new Date().toISOString().split('T')[0];

    const getValue=(...names)=>{
      for(const name of names){
        const field=form.elements[name];
        if(field && String(field.value||'').trim()) return String(field.value).trim();
      }
      return '';
    };

    const buildMessage=()=>{
      const pickup=getValue('pickup','pickup_address');
      const destination=getValue('destination','airport','dropoff');
      const dateValue=getValue('date','collection_date');
      const timeValue=getValue('time','pickup_time','collection_time');
      const passengers=getValue('passengers');
      const luggage=getValue('luggage','large_cases');
      const journey=getValue('journey_type','journey');
      const name=getValue('name','customer_name');
      const customerPhone=getValue('phone','telephone');
      const customerEmail=getValue('email','customer_email');
      const details=getValue('details','message','requirements');

      return [
        'Hello, I would like a transfer quotation.',
        '',
        'Pickup: '+pickup,
        'Destination: '+destination,
        'Collection date: '+dateValue,
        'Collection time: '+timeValue,
        'Passengers: '+passengers,
        'Luggage / large cases: '+luggage,
        'Journey type: '+journey,
        '',
        'Name: '+name,
        'Telephone: '+customerPhone,
        'Email: '+customerEmail,
        '',
        'Additional details:',
        details
      ].join('\n');
    };

    const validateForm=()=>{
      if(!form.reportValidity()) return false;
      return true;
    };

    form.querySelectorAll('[data-send-method]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(!validateForm()) return;
        const method=btn.dataset.sendMethod;
        const message=buildMessage();
        const status=form.querySelector('.form-status');

        if(method==='whatsapp'){
          window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(message),'_blank','noopener');
          if(status) status.textContent='WhatsApp has been opened with your quotation details ready to send.';
        }else if(method==='email'){
          const subject='Transfer quotation request';
          window.location.href='mailto:'+email+
            '?subject='+encodeURIComponent(subject)+
            '&body='+encodeURIComponent(message);
          if(status) status.textContent='Your email application should now open with the quotation details ready to send.';
        }else if(method==='sms'){
          const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
          const separator=isiOS?'&':'?';
          window.location.href='sms:+'+phone+separator+'body='+encodeURIComponent(message);
          if(status) status.textContent='Your text messaging app should now open with the quotation details ready to send.';
        }
      });
    });

    form.addEventListener('submit',e=>e.preventDefault());
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
    window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js?v=23').catch(()=>{}));
  }
})();