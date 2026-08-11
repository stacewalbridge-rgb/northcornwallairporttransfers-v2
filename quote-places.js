document.addEventListener('DOMContentLoaded', function () {
  const pickup=document.querySelector('input[name="pickup"]'),destination=document.querySelector('input[name="destination"]');
  if(!pickup||!destination)return;
  function unavailable(message){[pickup,destination].forEach(input=>{input.setCustomValidity(message);input.placeholder=message;});}
  function attach(input){
    const autocomplete=new google.maps.places.Autocomplete(input,{componentRestrictions:{country:'gb'},fields:['formatted_address','geometry','name','place_id']});
    autocomplete.addListener('place_changed',function(){const place=autocomplete.getPlace();if(!place.geometry?.location){input.dataset.googleSelected='';input.setCustomValidity('Please choose this location from the Google suggestions.');return;}input.value=place.formatted_address||place.name||input.value;input.dataset.googleSelected='true';input.dataset.lat=String(place.geometry.location.lat());input.dataset.lng=String(place.geometry.location.lng());input.dataset.placeId=place.place_id||'';input.setCustomValidity('');});
    input.addEventListener('input',function(){input.dataset.googleSelected='';input.setCustomValidity('Please choose this location from the Google suggestions.');});
  }
  const key=String(window.ROBS_TRAVEL_CONFIG?.googleMapsApiKey||'').trim();
  if(!key)return unavailable('Google address search is temporarily unavailable.');
  window.__ncatQuotePlacesReady=function(){attach(pickup);attach(destination);};
  const script=document.createElement('script');script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)+'&libraries=places&callback=__ncatQuotePlacesReady&v=weekly';script.async=true;script.defer=true;script.onerror=()=>unavailable('Google address search could not load.');document.head.appendChild(script);
});
