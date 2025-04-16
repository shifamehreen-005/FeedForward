function initMap() {
    const directionsService = new google.maps.DirectionsService();
    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 13,
      center: { lat: 38.9656, lng: -76.9190 },
    });

    const points = {
      A: { lat: 38.8899, lng: -77.0091 },   // Capitol Hill
      B: { lat: 38.9914, lng: -76.9375 },   // The Alloy
      C: { lat: 38.9656, lng: -76.9190 },   // Riverdale
      D: { lat: 38.9506, lng: -76.9189 },   // Cheverly Hospital
    };

    const markers = {
      A: new google.maps.Marker({ position: points.A, map, label: "A", title: "Capitol Hill, DC" }),
      B: new google.maps.Marker({ position: points.B, map, label: "B", title: "The Alloy, College Park" }),
      C: new google.maps.Marker({ position: points.C, map, label: "C", title: "Riverdale, MD" }),
      D: new google.maps.Marker({ position: points.D, map, label: "D", title: "Cheverly Hospital, MD" }),
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
                          scale: 4
                      },
                      offset: "0",
                      repeat: "15px"
                      }]
                  })
      });

      path.setMap(map);
    } else {
      console.error(`Route error: ${status}`);
    }
  }
);
}


    drawRoute(points.A, points.B, "TRANSIT", "#e76f51"); // Bus: Coral
    drawRoute(points.B, points.C, "DRIVING", "#457b9d"); // Car: Blue
    drawRoute(points.C, points.D, "WALKING", "#2a9d8f"); // Walk: Teal
  }