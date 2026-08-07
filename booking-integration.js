window.NCAT_BOOKING = {
  provider: "Robs Travel",
  bookingUrl: "https://robs-travel.co.uk/",
  relationship: "North Cornwall Airport Transfers is part of the Robs Travel Group."
};

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-robs-booking]").forEach(function (link) {
    link.setAttribute("href", window.NCAT_BOOKING.bookingUrl);
  });
});
