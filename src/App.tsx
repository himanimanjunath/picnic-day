import { useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types
type Event = {
  id: number;
  name: string;
  lat: number;
  lng: number;
};

// Dummy Picnic Day events (mock data)
const EVENTS: Event[] = [
  { id: 1, name: "Opening Ceremony", lat: 38.5382, lng: -121.7617 },
  { id: 2, name: "Engineering Expo", lat: 38.5405, lng: -121.7496 },
  { id: 3, name: "Animal Science Demo", lat: 38.5396, lng: -121.7544 },
  { id: 4, name: "Chemistry Magic Show", lat: 38.5369, lng: -121.7589 },
];

// Sortable item 
function SortableItem({ event, index }: { event: Event; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: "1px solid #ccc",
    padding: 8,
    marginBottom: 8,
    background: "#fff",
    cursor: "grab",
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {index + 1}. {event.name}
    </div>
  );
}

// App 
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

  const path = itinerary.map(e => [e.lat, e.lng] as [number, number]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", height: "100vh" }}>

      {/* Search */}
      <div style={{ padding: 16, borderRight: "1px solid #ddd" }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search events"
          style={{ width: "100%", padding: 8 }}
        />
        {query && (
          <ul>
            {filteredEvents.map(event => (
              <li
                key={event.id}
                style={{ cursor: "pointer", padding: 8 }}
                onClick={() => addEvent(event)}
              >
                {event.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <MapContainer
        center={[38.5382, -121.7617] as [number, number]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {itinerary.map((event, index) => (
          <Marker key={event.id} position={[event.lat, event.lng]}>
            <Tooltip permanent>{index + 1}</Tooltip>
          </Marker>
        ))}

        {path.length > 1 && <Polyline positions={path} />}
      </MapContainer>

      {/* Itinerary */}
      <div style={{ padding: 16, borderLeft: "1px solid #ddd" }}>
        <h2>Itinerary</h2>

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
    </div>
  );
}
