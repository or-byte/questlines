import { Skeleton } from "@kobalte/core/skeleton";
import { For } from "solid-js";

export default function HostSkeleton() {
    return (
        <div class="mx-4 sm:mx-8 lg:mx-30 py-4 sm:py-6">
            {/* Host Title Skeleton */}
            <Skeleton
                class="skeleton mb-6" height={40} radius={6} style={{ width: "60%" }}
            />

            {/* Carousel Skeleton */}
            <div class="flex justify-center items-center mb-13">
                <Skeleton
                    class="skeleton"
                    radius={8}
                    style={{ height:  "16rem", width: "100%" }}
                />
            </div>

            <div class="lg:flex-row gap-6 sm:gap-10 lg:gap-20 items-start mt-4 sm:mt-6 lg:mt-[20px]">
                {/* Main Content */}
                <div class="flex-1 w-full min-w-0 space-y-6 sm:space-y-8 lg:space-y-10"></div>
                {/* Court Cards Skeleton */}
                <div class="flex flex-col gap-3 sm:gap-4 lg:gap-[20px] w-full">
                    <For each={Array(3)}>
                        {() => (
                            <Skeleton
                                class="skeleton w-full"
                                height={80}
                                radius={6}
                                style={{ width: "65%" }}
                            />
                        )}
                    </For>
                </div>
            </div>
        </div>
    )
}