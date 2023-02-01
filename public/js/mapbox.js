export const displayMap = (locations) => {
  const map = L.map('map').setView([31.111745, -118.113491], 5);
  L.DomEvent.disableScrollPropagation(document.getElementById('map'));

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const markerArray = [];
  locations.forEach((loc) => {
    const reversedArr = [...loc.coordinates].reverse();
    const description = loc.description;

    const myIcon = L.icon({
      iconUrl: './../img/pin.png',
      iconSize: [30, 35],
      iconAnchor: [15, 35],
    });

    L.marker(reversedArr, { icon: myIcon, title: description }).addTo(map);
    markerArray.push(reversedArr);
  });
  const bounds = L.latLngBounds(markerArray);
  map.fitBounds(bounds);
};
