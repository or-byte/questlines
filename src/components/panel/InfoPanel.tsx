import {
  MdOutlineEmail,
  MdOutlineLocation_on,
  MdFillLocal_phone,
} from "solid-icons/md";
import { OcSparklefill2 } from 'solid-icons/oc';
import { For } from "solid-js";
import { InfoDetail, Information } from "~/lib/host";

type InfoPanelProps = {
  header: Information,
  body: InfoDetail[]
}

const iconMap = {
  MdOutlineEmail,
  MdOutlineLocation_on,
  MdFillLocal_phone,
};

export default function InfoPanel(props: InfoPanelProps) {
  return (
    <div class="flex flex-col items-start">
      <SectionTitle title={props.header.title} />


      <ul class="space-y-3 mb-10">
        <For each={props.body}>
          {(item) => {
            if (item.icon) {
              const Icon = iconMap[item.icon as keyof typeof iconMap];
              return (<IconRow icon={Icon} text={item.text} />)
            }
            else {
              return (
                <StarItem text={item.text} />
              )
            }
          }}
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
      <p class="body-2 text-[var(--color-footer)] text-left">{props.text}</p>
    </div>
  );
};

const StarItem = (props: { text: string }) => (
  <li class="flex items-start gap-3">
    <OcSparklefill2 size={16} class="text-[var(--color-accent-1)] mt-1 shrink-0" />
    <p class="body-2 text-[var(--color-footer)] text-left">{props.text}</p>
  </li>
);
