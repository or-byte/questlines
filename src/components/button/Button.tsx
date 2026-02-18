import { Button } from "@kobalte/core/button";
import type { JSX } from "solid-js";

type ButtonProps = {
  children: JSX.Element;
  class?: string;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export default function CustomButton(props: ButtonProps) {
  return (
    <Button
      class={`${props.class ?? ""}`}
      {...props}>
    </Button>);
}