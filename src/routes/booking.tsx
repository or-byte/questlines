import { Title } from "@solidjs/meta";
import { createSignal } from "solid-js"
import Button from "../components/button/Button";
import Carousel from "~/components/carousel/Carousel";
import CourtCard from "~/components/court_card/CourtCard";
import TimeSlot from "~/components/time_slot/TimeSlot";
import DatePicker from "~/components/calendar/DatePicker";
import BookingSummary from "~/components/summary/BookingSummary";
import InfoPanel from "~/components/panel/InfoPanel";

export default function Booking() {
    const [date, setDate] = createSignal("2026-02-11");
    const imageUrls = [
        'https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp',
        'https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp'
    ];

    return (
        <main>
            <Title>Booking</Title>
            <div class="mx-30">
                <h1 class="text-[var(--color-text-1)] text-justify">Cana Pickle Ball</h1>
                <Carousel images={imageUrls} />
                <div class="flex flex-col lg:flex-row gap-10 items-start mt-[20px]">
                    <div class="flex-1 min-w-0 space-y-10">
                        <div class="flex flex-col gap-[20px] w-full">
                            <CourtCard title="Pickleball Court 1" isSelected={true} thumbnail="https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp" />
                            <CourtCard title="Pickleball Court 2" isSelected={false} thumbnail="https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp" />
                            <CourtCard title="Pickleball Court 3" isSelected={false} thumbnail="https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp" />
                            <CourtCard title="Pickleball Court 4" isSelected={false} thumbnail="https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp" />
                            <CourtCard title="Pickleball Court 5" isSelected={false} thumbnail="https://www.sportsimports.com/wp-content/uploads/How-to-Build-an-Outdoor-Pickleball-Court-.webp" />
                        </div>
                        <h2 class="text-[var(--color-text-1)] text-justify">Pickle Ball Court 1</h2>
                        <div class="flex flex-col items-baseline gap-[30px]">
                            <h3 class="text-[var(--color-text-1)]">Select Date</h3>
                            <div class="w-full grid grid-cols-2">
                                <DatePicker value={date()} onChange={setDate} />
                            </div>
                        </div>
                        <div class="flex flex-col items-baseline gap-[30px]">
                            <h3 class="text-[var(--color-text-1)]">Select Time</h3>
                            <div class="grid grid-cols-2 gap-6 w-full">
                                <TimeSlot isSelected={false} time="6:00 AM - 7:00 AM" price="300.00" />
                                <TimeSlot isSelected={false} time="6:00 AM - 7:00 AM" price="300.00" />
                                <TimeSlot isSelected={false} time="6:00 AM - 7:00 AM" price="300.00" />
                                <TimeSlot isSelected={false} time="6:00 AM - 7:00 AM" price="300.00" />
                            </div>
                        </div>
                        <div>
                            <div class="border-t border-neutral-300 pt-4 flex items-center justify-between space-y-3" />
                            <BookingSummary
                                rows={[
                                    { label: 'Date', value: 'Feb 10, 2026' },
                                    { label: 'Time', value: '4:00 PM - 8:00 PM' },
                                    { label: 'Amount', value: '₱300.00' },
                                ]}
                                total="₱300.00"
                                onBook={() => console.log('Booking confirmed')}
                            />
                        </div>
                    </div>
                    <aside class="w-full lg:w-[490px] shrink-0 space-y-10 lg:sticky lg:top-8">
                        <div class="flex justify-between w-full items-center">
                            <h3 class="text-[var(--color-text-1)]">Operating Hours</h3>
                            <p class="body-3">Open</p>
                        </div>
                        <InfoPanel
                            email="sampleemail@gmail.com"
                            address="Address, address, address"
                            contact="+63 991 123 4561"
                            facilities={[ "Facility1", "Facility2"]}
                            rules={[ "rule1", "rule1"]}
                        />
                    </aside>
                </div>
            </div>
        </main>
    );
}
