"use client";

import { useState } from "react";
import { Plane, ArrowRightLeft, Calendar, Users } from "lucide-react";
import { AirplaneTakeoff, AirplaneLanding } from "@phosphor-icons/react";
import { ServicePageHeader } from "@/components/dashboard/ServicePage";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import { SearchBand, SearchTile, ResultCard } from "@/components/dashboard/services/TravelSearch";
import { formatINR } from "@/lib/utils";

const cities = [
  "DEL · Delhi",
  "BOM · Mumbai",
  "BLR · Bengaluru",
  "MAA · Chennai",
  "CCU · Kolkata",
  "HYD · Hyderabad",
  "GOI · Goa",
  "PNQ · Pune",
  "AMD · Ahmedabad",
  "JAI · Jaipur"
];

type Flight = {
  airline: string;
  flightNo: string;
  depart: string;
  arrive: string;
  duration: string;
  fare: number;
  stops: string;
};

const sampleFlights: Flight[] = [
  {
    airline: "IndiGo",
    flightNo: "6E-2031",
    depart: "06:15",
    arrive: "08:45",
    duration: "2h 30m",
    fare: 4299,
    stops: "Non-stop"
  },
  {
    airline: "Air India",
    flightNo: "AI-805",
    depart: "08:50",
    arrive: "11:25",
    duration: "2h 35m",
    fare: 4799,
    stops: "Non-stop"
  },
  {
    airline: "Vistara",
    flightNo: "UK-995",
    depart: "13:10",
    arrive: "15:55",
    duration: "2h 45m",
    fare: 5299,
    stops: "Non-stop"
  },
  {
    airline: "SpiceJet",
    flightNo: "SG-160",
    depart: "18:35",
    arrive: "21:15",
    duration: "2h 40m",
    fare: 3899,
    stops: "Non-stop"
  }
];

export default function FlightPage() {
  const [from, setFrom] = useState(cities[0]);
  const [to, setTo] = useState(cities[2]);
  const [date, setDate] = useState("");
  const [pax, setPax] = useState(1);
  const [searched, setSearched] = useState(false);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const fromCode = from.split(" · ")[0];
  const toCode = to.split(" · ")[0];

  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={Plane}
        title="Flight Booking"
        description="Domestic flights at agent fares — search, compare, book."
      />

      <SearchBand
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(true);
        }}
        eyebrow="Flights"
        title="Where are we flying?"
        subtitle="One-way domestic search. Fares include your agent margin."
        footer={
          <>
            <Badge size="sm" className="bg-white/10 text-white ring-white/15">Agent fares</Badge>
            <Badge size="sm" className="bg-white/10 text-white ring-white/15">Domestic routes</Badge>
          </>
        }
      >
        <div className="grid items-stretch gap-3 lg:grid-cols-12">
          <SearchTile label="From" htmlFor="fl-from" icon={<AirplaneTakeoff weight="duotone" />} className="lg:col-span-3">
            <Select id="fl-from" value={from} onChange={(e) => setFrom(e.target.value)}>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </SearchTile>
          <div className="flex items-center justify-center lg:col-span-1">
            <button
              type="button"
              onClick={swap}
              aria-label="Swap origin and destination"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white hover:text-ink-950 focus-energy"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          </div>
          <SearchTile label="To" htmlFor="fl-to" icon={<AirplaneLanding weight="duotone" />} className="lg:col-span-3">
            <Select id="fl-to" value={to} onChange={(e) => setTo(e.target.value)}>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </SearchTile>
          <SearchTile label="Departure" htmlFor="fl-date" icon={<Calendar />} className="lg:col-span-2">
            <Input
              id="fl-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </SearchTile>
          <SearchTile label="Travellers" htmlFor="fl-pax" icon={<Users />} className="lg:col-span-2">
            <Select id="fl-pax" value={pax} onChange={(e) => setPax(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n > 1 ? "Adults" : "Adult"}
                </option>
              ))}
            </Select>
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
              {sampleFlights.length} flights found · {fromCode} → {toCode}
            </h3>
            <Badge variant="accent" size="sm" dot>
              Live fares
            </Badge>
          </div>
          {sampleFlights.map((f, i) => (
            <ResultCard key={f.flightNo} index={i} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <IconTile tone="brand" size="lg">
                  <Plane className="h-5 w-5" />
                </IconTile>
                <div>
                  <p className="font-display text-base font-semibold tracking-[-0.01em] text-ink-900">
                    {f.airline}
                  </p>
                  <p className="font-mono text-xs text-ink-500">{f.flightNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <p className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">
                    {f.depart}
                  </p>
                  <p className="text-xs text-ink-500">{fromCode}</p>
                </div>
                <div className="flex flex-col items-center text-xs text-ink-500">
                  <span>{f.duration}</span>
                  <span className="my-1 h-px w-20 bg-energy-gradient-x opacity-60" />
                  <span>{f.stops}</span>
                </div>
                <div>
                  <p className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">
                    {f.arrive}
                  </p>
                  <p className="text-xs text-ink-500">{toCode}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">
                  {formatINR(f.fare * pax)}
                </p>
                <p className="text-xs text-ink-500">
                  for {pax} {pax > 1 ? "travellers" : "traveller"}
                </p>
                <Button size="sm" className="mt-2">
                  Book
                </Button>
              </div>
            </ResultCard>
          ))}
        </div>
      )}
    </div>
  );
}
