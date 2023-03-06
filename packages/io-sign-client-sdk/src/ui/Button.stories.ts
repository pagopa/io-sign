import { Meta, Story } from "@storybook/web-components";
import { html, nothing } from "lit-html";

import type { IOButtonElementAttributes } from "./Button";

import "./Button";

type Arguments = IOButtonElementAttributes;

export default {
  title: "Design System/Button",
  component: "io-button",
  argTypes: {
    disabled: {
      name: "Disabled",
      type: "boolean",
      control: {
        type: "boolean",
      },
      defaultValue: false,
    },
  },
} as Meta<Arguments>;

export const Button: Story<Arguments> = ({ disabled }) =>
  html`<io-button disabled="${disabled ? "disabled" : nothing}"
    >Ciao a tutti</io-button
  >`;
