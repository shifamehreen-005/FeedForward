document.addEventListener("DOMContentLoaded", () => {
  // const transitBtn = document.getElementById("transit-details");

  // transitBtn.addEventListener("click", () => {
    initMap();
  // });
});

function initMap() {
  const directionsService = new google.maps.DirectionsService();
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: { lat: 38.98, lng: -76.94 },
  });

  const points = {
    A: { lat: 38.992271, lng: -76.934361 },           // Walk Start
    B: { lat: 38.99238120873557, lng: -76.9334509612648 }, // Bus Start
    C: { lat: 38.97815148541904, lng: -76.92758240998751 }, // Subway Start
    D: { lat: 38.95567864752957, lng: -76.96897303782839 }, // Walk Start
    E: { lat: 38.9542534204, lng: -76.9652870101 },         // Final destination
  };

  const markers = {
    A: new google.maps.Marker({ position: points.A, map, label: "A", title: "Start Walk" }),
    B: new google.maps.Marker({ position: points.B, map, label: "B", title: "Bus Stop: Navahoe Rd" }),
    C: new google.maps.Marker({ position: points.C, map, label: "C", title: "Metro Station: College Park-U of MD" }),
    D: new google.maps.Marker({ position: points.D, map, label: "D", title: "West Hyattsville Metro" }),
    E: new google.maps.Marker({ position: points.E, map, label: "E", title: "Destination: Kirkwood" }),
  };

  // Helper to draw route with custom color
  function drawRoute(origin, destination, mode, color) {
    directionsService.route(
      { origin, destination, travelMode: mode },
      (result, status) => {
        if (status === "OK") {
          const isWalking = mode === "WALKING";
          const path = new google.maps.Polyline({
            path: result.routes[0].overview_path,
            strokeColor: color,
            strokeOpacity: 1.0,
            strokeWeight: 4,
            geodesic: true,
            ...(isWalking && {
              strokeOpacity: 0,
              icons: [{
                icon: {
                  path: "M 0,-1 0,1",
                  strokeOpacity: 1,
                  scale: 4,
                },
                offset: "0",
                repeat: "15px",
              }],
            }),
          });
          path.setMap(map);
        } else {
          console.error(`Route error: ${status}`);
        }
      }
    );
  }

  drawRoute(points.A, points.B, "WALKING", "#2a9d8f");    // Walk 1: Teal
  drawRoute(points.B, points.C, "TRANSIT", "#e76f51");    // Bus: Coral
  drawRoute(points.C, points.D, "TRANSIT", "#264653");    // Subway: Dark Greenish
  drawRoute(points.D, points.E, "WALKING", "#2a9d8f");    // Walk 2: Teal
}
