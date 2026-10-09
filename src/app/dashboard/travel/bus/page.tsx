"use client";

import { useState } from "react";
import { Bus, Calendar, MapPin, Navigation } from "lucide-react";
import { ServicePageHeader } from "@/components/dashboard/ServicePage";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import { SearchBand, SearchTile, ResultCard } from "@/components/dashboard/services/TravelSearch";
import { formatINR } from "@/lib/utils";

const cities = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Jaipur",
  "Kolkata",
  "Lucknow",
  "Chandigarh"
];

const buses = [
  { name: "VRL Travels", type: "AC Sleeper", depart: "21:30", arrive: "07:45", fare: 1199, seats: 12 },
  { name: "SRS Travels", type: "AC Semi-Sleeper", depart: "20:00", arrive: "07:00", fare: 899, seats: 8 },
  { name: "Orange Tours", type: "Volvo Multi-Axle", depart: "22:15", arrive: "08:30", fare: 1399, seats: 5 },
  { name: "RedBus Express", type: "Non-AC Seater", depart: "19:45", arrive: "06:30", fare: 599, seats: 22 }
];

export default function BusPage() {
  const [from, setFrom] = useState(cities[0]);
  const [to, setTo] = useState(cities[5]);
  const [date, setDate] = useState("");
  const [searched, setSearched] = useState(false);

  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={Bus}
        title="Bus Booking"
        description="AC sleeper, semi-sleeper and seater buses across India."
      />

      <SearchBand
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(true);
        }}
        eyebrow="Buses"
        title="Pick a route"
        subtitle="Overnight and day services from every major operator."
        footer={
          <>
            <Badge size="sm" className="bg-white/10 text-white ring-white/15">AC &amp; non-AC</Badge>
            <Badge size="sm" className="bg-white/10 text-white ring-white/15">Sleeper · Seater</Badge>
          </>
        }
      >
        <div className="grid items-stretch gap-3 lg:grid-cols-12">
          <SearchTile label="From" htmlFor="bus-from" icon={<MapPin />} className="lg:col-span-4">
            <Select id="bus-from" value={from} onChange={(e) => setFrom(e.target.value)}>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </SearchTile>
          <SearchTile label="To" htmlFor="bus-to" icon={<Navigation />} className="lg:col-span-4">
            <Select id="bus-to" value={to} onChange={(e) => setTo(e.target.value)}>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </SearchTile>
          <SearchTile label="Travel date" htmlFor="bus-date" icon={<Calendar />} className="lg:col-span-3">
            <Input
              id="bus-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </SearchTile>
          <div className="lg:col-span-1">
            <Button type="submit" size="lg" className="h-full min-h-[3.5rem] w-full">
              Search
            </Button>
          </div>
        </div>
      </SearchBand>

      {searched && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
              {buses.length} buses · {from} → {to}
            </h3>
            <Badge variant="accent" size="sm" dot>
              Live availability
            </Badge>
          </div>
          {buses.map((b, i) => (
            <ResultCard key={b.name} index={i} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <IconTile tone="royal" size="lg">
                  <Bus className="h-5 w-5" />
                </IconTile>
                <div>
                  <p className="font-display text-base font-semibold tracking-[-0.01em] text-ink-900">
                    {b.name}
                  </p>
                  <p className="text-xs text-ink-500">{b.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">
                    {b.depart}
                  </p>
                  <p className="text-xs text-ink-500">{from}</p>
                </div>
                <span className="h-px w-12 bg-energy-gradient-x opacity-60" />
                <div>
                  <p className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">
                    {b.arrive}
                  </p>
                  <p className="text-xs text-ink-500">{to}</p>
                </div>
                <Badge variant={b.seats <= 5 ? "coral" : "accent"} size="sm">
                  {b.seats} seats left
                </Badge>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">
                  {formatINR(b.fare)}
                </p>
                <Button size="sm" className="mt-2">
                  Select seats
                </Button>
              </div>
            </ResultCard>
          ))}
        </div>
      )}
    </div>
  );
}
