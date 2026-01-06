//import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

//L is used to create maps, markers, icons, etc
import L from "leaflet";

//Leaflet’s required CSS
import "leaflet/dist/leaflet.css";

//Leaflet expects marker icons to be loaded from local image files - we don't have this in Vite
//Deletes Leaflet’s internal method that auto-resolves icon URLs
delete (L.Icon.Default.prototype as any)._getIconUrl;

//Overrides Leaflet’s default marker icon configuration
//Applies to all markers unless you explicitly set a custom icon
L.Icon.Default.mergeOptions({

  //first two are for the marker icon image, the shadowURL is for a shadow effect on the marker (aesthetic)
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

createRoot(document.getElementById('root')!).render(
    <App />
)
