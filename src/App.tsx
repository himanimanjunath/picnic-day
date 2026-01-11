import { useState } from "react";
import { MapContainer, TileLayer, Marker} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

//for routes
import RoutingMachine from "./components/RoutingMachine";

//for export
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";


//for the drag option in the itinerary section 
//DndContext wraps everything that supports dragging and closestCenter decides which item you’re dragging 
import { DndContext, closestCenter } from "@dnd-kit/core";

//useSortable → makes a list item draggable
//SortableContext → groups sortable items
//arrayMove → reorders array items
//verticalListSortingStrategy → tells dnd-kit this is a vertical list
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Event = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  time: string;
  location: string;
};

const EVENTS: Event[] = [
  {
    id: 1,
    name: "Opening Ceremony",
    lat: 38.5382,
    lng: -121.7617,
    time: "9:00 – 9:45 AM",
    location: "Quad Stage",
  },
  {
    id: 2,
    name: "Engineering Expo",
    lat: 38.5405,
    lng: -121.7496,
    time: "10:00 AM – 2:00 PM",
    location: "Kemper Hall",
  },
  {
    id: 3,
    name: "Animal Science Demo",
    lat: 38.5396,
    lng: -121.7544,
    time: "11:00 – 11:30 AM",
    location: "Hoover Barn",
  },
  {
    id: 4,
    name: "Chemistry Magic Show",
    lat: 38.5369,
    lng: -121.7589,
    time: "1:00 – 1:45 PM",
    location: "Chemistry Annex",
  },
];

const COLORS = [
  //"#2563eb",

  "#8F9532",
  "#D4A61B",
  "#6FB3C9",
  "#4F7FA6",

  /*
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  */
];

function getColor(index: number) {
  return COLORS[index % COLORS.length];
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

//Creates custom Leaflet map marker and displays colored circle with number inside
function createNumberedIcon(color: string, number: number) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4);">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function SortableItem({
  event,
  index,
  onOpenMaps,
}: {
  event: Event;
  index: number;
  onOpenMaps: (event: Event) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: event.id });
  const color = getColor(index);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "8px",
    background: `${color}20`,
    borderLeft: `6px solid ${color}`,
    cursor: "grab",
  };

  return (
  <div
    ref={setNodeRef}
    style={style}
    {...attributes}
    {...listeners}
    onDoubleClick={() => onOpenMaps(event)}
    title="Double-click for walking directions"
  >
      <div>
        <strong>{index + 1}. {event.name}</strong>
        <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>
          {event.time} • {event.location}
        </div>
      </div>
    </div>
  );
}

const UC_DAVIS_BOUNDS: [[number, number], [number, number]] = [
  [38.531, -121.775], // southwest
  [38.548, -121.745], // northeast
];

function openInGoogleMaps(event: Event) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}&travelmode=walking`;
  window.open(url, "_blank");
}

const STORAGE_KEY = "picnic-day-itinerary";

function loadItinerary(): Event[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveItinerary(itinerary: Event[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary));
}

export default function App() {
  const [query, setQuery] = useState("");
  //const [itinerary, setItinerary] = useState<Event[]>([]);
  const [itinerary, setItinerary] = useState<Event[]>(() => loadItinerary());

  const mapRef = useRef<HTMLDivElement>(null);
  const itineraryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  saveItinerary(itinerary);
  }, [itinerary]);

  //pdf
  const exportPDF = async () => {
  if (!mapRef.current || itinerary.length === 0) return;

   await new Promise(resolve => setTimeout(resolve, 500));

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginX = 16;
  let y = 18;

  /* pdf title */

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Picnic Day Personalized Itinerary", marginX, y);

  y += 10;

  /* map with routes */

  const mapCanvas = await html2canvas(mapRef.current, {
    useCORS: true,
    backgroundColor: "#ffffff",
    scale: 2,
  });

  const mapWidth = pageWidth - marginX * 2;
  const mapHeight = (mapCanvas.height * mapWidth) / mapCanvas.width;

  pdf.addImage(
    mapCanvas.toDataURL("image/png"),
    "PNG",
    marginX,
    y,
    mapWidth,
    mapHeight
  );

  y += mapHeight + 10;

  /* walking route */

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Walking Route", marginX, y);

  y += 8;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");

  itinerary.forEach((event, index) => {
    if (y > pageHeight - 20) {
      pdf.addPage();
      y = 20;
    }

    const color = getColor(index);
    const { r, g, b } = hexToRgb(color);

    // Colored number
    pdf.setTextColor(r, g, b);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${index + 1}.`, marginX, y);

    // Event name
    pdf.setTextColor(0, 0, 0);
    pdf.text(event.name, marginX + 8, y);

    y += 6;

    // Time + location
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(90, 90, 90);
    pdf.text(
      `${event.time} • ${event.location}`,
      marginX + 8,
      y
    );

    y += 8;
  });

  /* saving the pdf */

  pdf.save("picnic-day-itinerary.pdf");
};
  //export end

  const filteredEvents = EVENTS.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase())
  );

  const addEvent = (event: Event) => {
    if (!itinerary.find(e => e.id === event.id)) {
      setItinerary([...itinerary, event]);
    }
    setQuery("");
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItinerary(items => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  return (
    <div className="page">
      <div className="left">
        <div className="search">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events"
          />
          {query && (
            <ul className="results">
              {filteredEvents.map(event => (
                <li key={event.id} onClick={() => addEvent(event)}>
                  {event.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="map" ref={mapRef}>
          <MapContainer
          center={[38.5382, -121.7617]}
          zoom={15}
          minZoom={14}
          maxZoom={18}
          maxBounds={UC_DAVIS_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: "100%", width: "100%" }}
          preferCanvas={false} //for the export w/ routes 
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {itinerary.map((event, index) => (
              <Marker
                key={event.id}
                position={[event.lat, event.lng]}
                icon={createNumberedIcon(getColor(index), index + 1)}
              />
            ))}

            <RoutingMachine
              points={itinerary.map(e => ({ lat: e.lat, lng: e.lng }))}
            />
          </MapContainer>
        </div>
      </div>

      <div className="right" ref={itineraryRef}>
        <h2>Picnic Day Itinerary</h2>

        {/*EXPORT BUTTON */}
        <button
          onClick={exportPDF}
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#2563eb",
            color: "white",
            border: "none",
            marginBottom: "12px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Export PDF
        </button>

        <p className="hint">Drag to reorder</p>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={itinerary.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {itinerary.map((event, index) => (
              <SortableItem
                key={event.id}
                event={event}
                index={index}
                onOpenMaps={openInGoogleMaps}
              />
            ))}

          </SortableContext>
        </DndContext>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }

        .page {
        display: flex;
        height: 100vh;
        width: 100vw;
        }

        .left {
        width: 60%;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #ddd;
        }

        .search {
        padding: 12px;
        border-bottom: 1px solid #ddd;
        background: white;
        }

        .search input {
        width: 100%;
        padding: 12px;
        font-size: 16px;
        display: block;
        }

        .results {
        margin-top: 8px;
        background: white;
        border: 1px solid #ccc;
        }

        .results li {
        padding: 10px;
        cursor: pointer;
        }

        .results li:hover {
        background: #f2f2f2;
        }

        .map {
        width: 100%;
        flex: 1;
        }

        .right {
        width: 40%;
        padding: 16px;
        overflow-y: auto;
        }

        .hint {
        font-size: 14px;
        color: #666;
        margin-bottom: 12px;
        }

        @media (max-width: 768px) {
        .page {
        flex-direction: column;
        }

        .left, .right {
        width: 100%;
        }

        .map {
        height: 50vh;
        flex: none;
        }
        }
      `}</style>
    </div>
  );
}