import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

type Point = {
  lat: number;
  lng: number;
};

type Props = {
  points: Point[];
};

export default function RoutingMachine({ points }: Props) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;

    const routingControl = L.Routing.control({
        waypoints: points.map(p => L.latLng(p.lat, p.lng)),

        router: L.Routing.mapbox(
            import.meta.env.VITE_MAPBOX_TOKEN,
            {
            profile: "mapbox/walking",
            language: "en",
            }
        ),

        createMarker: () => null,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        show: false,

        lineOptions: {
        styles: [
          {
            color: "#2563eb",
            weight: 5,
            opacity: 0.9,
          },
        ],
        },
      }).addTo(map);

    /* OSRM router
    const routingControl = L.Routing.control({
        waypoints: points.map(p => L.latLng(p.lat, p.lng)),

        router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
            profile: "foot",
            timeout: 30 * 1000,
            }),

        routingOptions: {
            alternatives: false,
        },

        createMarker: () => null, 
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        show: false,

        lineOptions: {
            styles: [{ weight: 5, color: "#2563eb" }]
        }
        }).addTo(map);
        */


    return () => {
      map.removeControl(routingControl);
    };
  }, [points, map]);

  return null;
}