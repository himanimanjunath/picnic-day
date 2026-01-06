import { useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
};

const EVENTS: Event[] = [
  { id: 1, name: "Opening Ceremony", lat: 38.5382, lng: -121.7617 },
  { id: 2, name: "Engineering Expo", lat: 38.5405, lng: -121.7496 },
  { id: 3, name: "Animal Science Demo", lat: 38.5396, lng: -121.7544 },
  { id: 4, name: "Chemistry Magic Show", lat: 38.5369, lng: -121.7589 },
];

const COLORS = [
  //"#2563eb",

  "#8F9532",
  "#D4A61B",
  "#6FB3C9",
  "#4F7FA6",

  /*
  "#AAB03C",
  "#FDC921",
  "#99D6EA",
  "#6798C0",
  */

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

//Creates custom Leaflet map marker and displays colored circle with number inside
function createNumberedIcon(color: string, number: number) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4);">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function SortableItem({ event, index }: { event: Event; index: number }) {
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <strong>{index + 1}.</strong> {event.name}
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [itinerary, setItinerary] = useState<Event[]>([]);

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

        <div className="map">
          <MapContainer
            center={[38.5382, -121.7617]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {itinerary.map((event, index) => (
              <Marker
                key={event.id}
                position={[event.lat, event.lng]}
                icon={createNumberedIcon(getColor(index), index + 1)}
              />
            ))}

            {itinerary.length > 1 &&
              itinerary.slice(1).map((event, index) => (
                <Polyline
                  key={event.id}
                  positions={[
                    [itinerary[index].lat, itinerary[index].lng],
                    [event.lat, event.lng],
                  ]}
                  color="#2563eb"
                />
              ))}
          </MapContainer>
        </div>
      </div>

      <div className="right">
        <h2>Picnic Day Itinerary</h2>
        <p className="hint">Drag to reorder</p>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={itinerary.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {itinerary.map((event, index) => (
              <SortableItem key={event.id} event={event} index={index} />
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