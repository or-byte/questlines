import { A } from "@solidjs/router";
import { createSignal, For } from "solid-js";
import Button from "../button/Button";
import { useNavigate } from "@solidjs/router";

const menuItems = [
    { href: "/about", label: "about" },
    { href: "/booking/cana", label: "booking" },
];

export default function NavBar() {
    const navigate = useNavigate();
    const [open, setOpen] = createSignal(false);

    const setTrue = (value: boolean) => setOpen(value);
    const goTo = (path: string) => {
        navigate(path);
    };

    return (
        <>
            <nav class="fixed top-0 left-0 w-full px-[30px] py-3 flex items-center justify-between z-50 bg-[var(--color-bg)]">
                <img src="/images/orbyte_logo.png" alt="logo" class="w-[96px] md:w-[129px] cursor-pointer" onClick={[goTo, "/"]} />
                <div>
                    <For each={menuItems} fallback={<div> Loading Items . . .</div>}>
                        {(item) =>
                            <A href={item.href}
                                class="
                                    cursor-pointer
                                    transition-colors duration-200
                                    text-[var(--color-text-1)]
                                    hover:text-[var(--color-accent-3)]/70
                                    navbar">
                                {item.label}
                            </A>}
                    </For>
                </div>
                <Button
                    type="button"
                    class="btn hidden md:inline-flex"
                    onClick={[goTo, "/login"]}>
                    sign in
                </Button>
                <button
                    class="md:hidden text-[var(--color-text)] text-2xl"
                    onClick={[setTrue, !open()]}
                    aria-label={open() ? "Close menu" : "Open menu"}
                    aria-expanded={open()}
                >
                    {open() ? "✕" : "☰"}
                </button>
            </nav>

            {/* Full-screen mobile menu */}
            {open() && (
                <div class={`fixed inset-0 z-40 bg-[var(--color-bg)] pt-[60px] transition-opacity duration-200 ${open() ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}>
                    <div class="flex flex-col items-start text-start gap-6 px-6 py-8 text-[var(--color-text)]">
                        <For each={menuItems} fallback={<div> Loading Items . . .</div>}>
                            {(item) =>
                                <A
                                    href={item.href}
                                    class="text-2xl w-full"
                                    onClick={[setTrue, !open()]}
                                >
                                    {item.label}
                                </A>}
                        </For>
                        <Button
                            class="btn"
                            onClick={[goTo, "/login"]}
                        >
                            Sign In
                        </Button>
                    </div>
                </div>
            )}

        </>
    );
}

