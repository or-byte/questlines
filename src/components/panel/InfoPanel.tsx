import {
  MdOutlineEmail,
  MdOutlineLocation_on,
  MdFillLocal_phone,
} from "solid-icons/md";
import { OcSparklefill2 } from 'solid-icons/oc';
import { For } from "solid-js";

type InfoPanelProps = {
  email: string;
  address: string;
  contact: string;
  facilities: string[];
  rules: string[]
}

export default function InfoPanel(props: InfoPanelProps) {
  return (
    <div class="flex flex-col items-start">
      {/* Contact Information */}
      <SectionTitle title="Contact Information" />

      <div class="space-y-4 mb-10">
        <IconRow icon={MdOutlineEmail} text={props.email} />
        <IconRow icon={MdOutlineLocation_on} text={props.address} />
        <IconRow icon={MdFillLocal_phone} text={props.contact} />
      </div>

      {/* Room Facilities */}
      <SectionTitle title="Room Facilities" />
      <ul class="space-y-3 mb-10">
        <For each={props.facilities}>
          {(item) => <StarItem text={item} />}
        </For>
      </ul>

      {/* Facility Rules */}
      <SectionTitle title="Facility Rules" />

      <ul class="space-y-4">
        <For each={props.rules}>
          {(item) => <StarItem text={item} />}
        </For>
      </ul>
    </div>
  );
}

const SectionTitle = (props: { title: string }) => (
  <h3 class="text-2xl font-semibold text-[#3a1b47] mb-6 tracking-wide">
    {props.title}
  </h3>
);

const IconRow = (props: { icon: any; text: string }) => {
  const Icon = props.icon;
  return (
    <div class="flex items-center gap-4">
      <Icon size={20} class="text-[var(--color-footer)]" />
      <p class="body-2 text-[var(--color-footer)]">{props.text}</p>
    </div>
  );
};

const StarItem = (props: { text: string }) => (
  <li class="flex items-start gap-3">
    <OcSparklefill2 size={16} class="text-[var(--color-accent-1)] mt-1 shrink-0" />
    <p class="body-2 text-[var(--color-footer)]">{props.text}</p>
  </li>
);