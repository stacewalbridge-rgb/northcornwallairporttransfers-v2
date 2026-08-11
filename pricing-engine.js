
/* =========================================================
   Instant postcode pricing engine
   ========================================================= */
document.addEventListener('DOMContentLoaded', async function () {
  const GOOGLE_MAPS_KEY = 'AIzaSyB-XFiKNlAOohHgBnEPtzk4gUwFwk-OqAs';
  const postcodeEl = document.getElementById('price-postcode');
  const airportEl = document.getElementById('price-airport');
  const vehicleEl = document.getElementById('price-vehicle');
  const passengersEl = document.getElementById('price-passengers');
  const luggageEl = document.getElementById('price-luggage');
  const zeroWrap = document.getElementById('zero-luggage-confirm');
  const zeroConfirm = document.getElementById('confirm-no-luggage');
  const calcBtn = document.getElementById('calculate-fixed-price');
  const statusEl = document.getElementById('price-engine-status');
  const resultEl = document.getElementById('price-result');
  const execEl = document.getElementById('executive-result');
  const amountEl = document.getElementById('price-result-amount');
  const summaryEl = document.getElementById('price-result-summary');

  if (!postcodeEl || !airportEl || !vehicleEl || !passengersEl || !luggageEl || !calcBtn) return;

  let config = null;
  let lastQuote = null;
  let selectedPickup = null;

  function loadGooglePlaces() {
    return new Promise((resolve, reject) => {
      if (window.google?.maps?.places) return resolve();
      window.__ncatGoogleReady = resolve;
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(GOOGLE_MAPS_KEY) + '&libraries=places&callback=__ncatGoogleReady&v=weekly';
      script.async = true;
      script.defer = true;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  try {
    await loadGooglePlaces();
    const autocomplete = new google.maps.places.Autocomplete(postcodeEl, {
      componentRestrictions: { country: 'gb' },
      fields: ['formatted_address', 'geometry', 'name', 'place_id']
    });
    autocomplete.addListener('place_changed', function () {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) {
        selectedPickup = null;
        setStatus('Please choose the pickup from the Google suggestions.', 'error');
        return;
      }
      selectedPickup = {
        address: place.formatted_address || place.name || postcodeEl.value,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        placeId: place.place_id || ''
      };
      postcodeEl.value = selectedPickup.address;
      setStatus('Google pickup location selected.', 'success');
      resetResults();
    });
    postcodeEl.addEventListener('input', function () { selectedPickup = null; });
  } catch (error) {
    setStatus('Google address search could not load. Please refresh and try again.', 'error');
  }

  try {
    const response = await fetch('pricing-config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Pricing configuration unavailable');
    config = await response.json();
  } catch (error) {
    statusEl.textContent = 'Instant pricing is temporarily unavailable. Please send us your journey for a personalised quote.';
    return;
  }

  function normalizePostcode(value) {
    return String(value || '').toUpperCase().replace(/\s+/g, '').trim();
  }

  function formatPostcode(value) {
    const p = normalizePostcode(value);
    if (p.length <= 3) return p;
    return p.slice(0, -3) + ' ' + p.slice(-3);
  }

  function haversineMiles(lat1, lon1, lat2, lon2) {
    const toRad = value => value * Math.PI / 180;
    const earthMiles = 3958.7613;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    return earthMiles * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  function getBand(distance) {
    return config.bands.find(band => distance <= band.maxMiles) || null;
  }

  function setStatus(message, type) {
    statusEl.textContent = message || '';
    statusEl.className = 'price-engine-status' + (type ? ' ' + type : '');
  }

  function resetResults() {
    resultEl.hidden = true;
    execEl.hidden = true;
    lastQuote = null;
  }

  function enforcePassengerLimit() {
    const vehicle = vehicleEl.value;
    const max = config.vehicleMaxPassengers[vehicle] || 8;
    Array.from(passengersEl.options).forEach(option => {
      if (!option.value) return;
      option.disabled = Number(option.value) > max;
    });
    if (Number(passengersEl.value) > max) passengersEl.value = '';
  }

  vehicleEl.addEventListener('change', function () {
    enforcePassengerLimit();
    resetResults();
  });

  luggageEl.addEventListener('change', function () {
    const zero = luggageEl.value === '0';
    zeroWrap.hidden = !zero;
    if (!zero) zeroConfirm.checked = false;
    resetResults();
  });

  [postcodeEl, airportEl, passengersEl].forEach(el => {
    el.addEventListener('change', resetResults);
    el.addEventListener('input', resetResults);
  });

  async function lookupPostcode() {
    if (!selectedPickup) throw new Error('Please choose your pickup address or postcode from the Google suggestions.');
    return selectedPickup;
  }

  function validateCommon() {
    if (!postcodeEl.value.trim()) return 'Please enter your pickup address or postcode.';
    if (!selectedPickup) return 'Please choose the pickup from the Google suggestions.';
    if (!airportEl.value) return 'Please choose an airport.';
    if (!vehicleEl.value) return 'Please choose a vehicle.';
    if (!passengersEl.value) return 'Please choose the number of passengers.';
    if (luggageEl.value === '') return 'Please tell us how much luggage will be carried.';

    const max = config.vehicleMaxPassengers[vehicleEl.value] || 8;
    if (Number(passengersEl.value) > max) {
      return 'That vehicle cannot be selected for the number of passengers entered.';
    }

    if (luggageEl.value === '0' && !zeroConfirm.checked) {
      return 'Please confirm that there is no luggage to be carried, or select the correct luggage amount.';
    }

    return '';
  }

  calcBtn.addEventListener('click', async function () {
    resetResults();
    const validation = validateCommon();
    if (validation) {
      setStatus(validation, 'error');
      return;
    }

    setStatus('Checking Google pickup location and pricing zone…', 'working');
    calcBtn.disabled = true;

    try {
      const postcodeData = await lookupPostcode();
      const distance = haversineMiles(
        config.budeCentre.lat,
        config.budeCentre.lng,
        postcodeData.latitude,
        postcodeData.longitude
      );

      const band = getBand(distance);
      const airport = config.airports[airportEl.value];
      const vehicle = vehicleEl.value;

      const baseQuote = {
        postcode: postcodeData.address,
        airportKey: airportEl.value,
        airport: airport ? airport.label : airportEl.options[airportEl.selectedIndex].text,
        vehicle,
        vehicleLabel: vehicleEl.options[vehicleEl.selectedIndex].text,
        passengers: passengersEl.value,
        luggage: luggageEl.value,
        distanceMiles: distance,
        band: band
      };

      if (vehicle === 'executive') {
        lastQuote = { ...baseQuote, executive: true };
        execEl.hidden = false;
        setStatus(
          'Executive vehicle selected. Please send the journey details so we can confirm vehicle suitability and provide the price.',
          'info'
        );
        return;
      }

      if (!airport || typeof airport[vehicle] !== 'number') {
        lastQuote = { ...baseQuote, manual: true };
        setStatus('This journey requires a personalised quotation. Please send the details to us.', 'info');
        execEl.hidden = false;
        execEl.querySelector('h3').textContent = 'Personal quotation required';
        execEl.querySelector('p').textContent = 'Please send your journey details and we will confirm the price personally.';
        return;
      }

      if (!band) {
        lastQuote = { ...baseQuote, manual: true };
        setStatus('Your postcode is more than 50 miles from central Bude. Please contact us for a personalised quotation.', 'info');
        execEl.hidden = false;
        execEl.querySelector('h3').textContent = 'Personal quotation required';
        execEl.querySelector('p').textContent = 'This pickup is outside the automatic pricing area. Send us the details and we will quote the journey personally.';
        return;
      }

      const base = airport[vehicle];
      const total = base + band.surcharge;

      lastQuote = {
        ...baseQuote,
        baseFare: base,
        surcharge: band.surcharge,
        total: total,
        executive: false,
        manual: false
      };

      amountEl.textContent = '£' + total;
      summaryEl.textContent =
        baseQuote.airport + ' • ' +
        baseQuote.vehicleLabel + ' • ' +
        baseQuote.postcode + ' • ' +
        distance.toFixed(1) + ' miles from central Bude • ' +
        (band.surcharge ? '£' + band.surcharge + ' zone supplement included' : 'Bude-area fixed price');

      resultEl.hidden = false;
      setStatus('Fixed fare calculated successfully.', 'success');
    } catch (error) {
      setStatus(error.message || 'We could not calculate the fare. Please request a personalised quote.', 'error');
    } finally {
      calcBtn.disabled = false;
    }
  });

  function buildMessage() {
    if (!lastQuote) return '';

    const lines = [
      'Hello North Cornwall Airport Transfers,',
      '',
      lastQuote.executive ? 'I would like an executive vehicle quotation.' :
        lastQuote.manual ? 'I would like a personalised airport transfer quotation.' :
        'I would like to confirm this fixed-fare airport transfer enquiry.',
      '',
        'Pickup location: ' + lastQuote.postcode,
      'Airport: ' + lastQuote.airport,
      'Vehicle: ' + lastQuote.vehicleLabel,
      'Passengers: ' + lastQuote.passengers,
      'Large cases / luggage: ' + lastQuote.luggage
    ];

    if (lastQuote.distanceMiles != null) {
      lines.push('Distance from central Bude (straight-line): ' + lastQuote.distanceMiles.toFixed(1) + ' miles');
    }

    if (!lastQuote.executive && !lastQuote.manual && lastQuote.total != null) {
      lines.push('Website fixed fare: £' + lastQuote.total);
      if (lastQuote.surcharge) lines.push('Zone supplement included: £' + lastQuote.surcharge);
    } else {
      lines.push('Price: To be confirmed personally');
    }

    if (lastQuote.luggage === '0') {
      lines.push('Customer confirmed: no luggage to be carried');
    }

    lines.push('', 'Please confirm availability and the booking details. Thank you.');
    return lines.join('\n');
  }

  document.addEventListener('click', function (event) {
    const button = event.target.closest('[data-price-send]');
    if (!button) return;
    if (!lastQuote) {
      setStatus('Please check the journey details first.', 'error');
      return;
    }

    const message = buildMessage();
    const method = button.getAttribute('data-price-send');

    if (method === 'whatsapp') {
      window.location.assign(
        'https://wa.me/' + config.business.phoneInternational + '?text=' + encodeURIComponent(message)
      );
      return;
    }

    if (method === 'email') {
      window.location.href =
        'mailto:' + config.business.email +
        '?subject=' + encodeURIComponent('Airport transfer quote request') +
        '&body=' + encodeURIComponent(message);
      return;
    }

    if (method === 'sms') {
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const separator = isiOS ? '&' : '?';
      window.location.href =
        'sms:+' + config.business.phoneInternational +
        separator + 'body=' + encodeURIComponent(message);
    }
  });

  enforcePassengerLimit();
});
