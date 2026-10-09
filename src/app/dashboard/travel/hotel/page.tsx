"use client";

import { useState } from "react";
import { Hotel, MapPin, Star, Calendar, Search } from "lucide-react";
import { ServicePageHeader } from "@/components/dashboard/ServicePage";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchBand, SearchTile, ResultCard } from "@/components/dashboard/services/TravelSearch";
import { formatINR } from "@/lib/utils";

const hotels = [
  {
    name: "The Lalit New Delhi",
    area: "Connaught Place",
    rating: 4.6,
    price: 7499
  },
  { name: "Taj Palace", area: "Sardar Patel Marg", rating: 4.8, price: 12999 },
  { name: "Lemon Tree Premier", area: "Aerocity", rating: 4.4, price: 5499 },
  { name: "ibis New Delhi", area: "Aerocity", rating: 4.3, price: 4799 },
  { name: "Radisson Blu", area: "Paschim Vihar", rating: 4.5, price: 6299 },
  { name: "OYO Townhouse 1024", area: "Karol Bagh", rating: 4.1, price: 1899 }
];

export default function HotelPage() {
  const [city, setCity] = useState("New Delhi");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [searched, setSearched] = useState(false);

  return (
    <div className="mx-auto max-w-6xl">
      <ServicePageHeader
        icon={Hotel}
        title="Hotel Booking"
        description="50,000+ hotels across India at exclusive agent rates."
      />

      <SearchBand
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(true);
        }}
        eyebrow="Hotels"
        title="Find a stay"
        subtitle="Search by city or hotel name. Rates include taxes."
        footer={
          <>
            <Badge size="sm" className="bg-white/10 text-white ring-white/15">Agent rates</Badge>
            <Badge size="sm" className="bg-white/10 text-white ring-white/15">Taxes included</Badge>
          </>
        }
      >
        <div className="grid items-stretch gap-3 lg:grid-cols-12">
          <SearchTile label="City / Hotel" htmlFor="ht-city" icon={<Search />} className="lg:col-span-5">
            <Input id="ht-city" value={city} onChange={(e) => setCity(e.target.value)} />
          </SearchTile>
          <SearchTile label="Check-in" htmlFor="ht-in" icon={<Calendar />} className="lg:col-span-3">
            <Input
              id="ht-in"
              type="date"
              required
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
            />
          </SearchTile>
          <SearchTile label="Check-out" htmlFor="ht-out" icon={<Calendar />} className="lg:col-span-3">
            <Input
              id="ht-out"
              type="date"
              required
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
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
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
              {hotels.length} stays in {city}
            </h3>
            <Badge variant="accent" size="sm" dot>
              Live rates
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hotels.map((h, i) => (
              <ResultCard key={h.name} index={i}>
                <div className="relative h-36 bg-gradient-to-br from-royal-100 via-brand-50 to-coral-100">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30" />
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {h.rating}
                  </span>
                </div>
                <div className="p-5">
                  <h4 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">
                    {h.name}
                  </h4>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500">
                    <MapPin className="h-3 w-3" /> {h.area}, {city}
                  </p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">
                        {formatINR(h.price)}
                      </p>
                      <p className="text-xs text-ink-500">per night, incl. taxes</p>
                    </div>
                    <Button size="sm">Book</Button>
                  </div>
                </div>
              </ResultCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
