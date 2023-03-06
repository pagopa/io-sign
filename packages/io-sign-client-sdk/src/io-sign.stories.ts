import { html } from "lit-html";
import { Meta, Story } from "@storybook/web-components";

import { IOSignButtonElementAttributes } from "./io-sign-button";
import "./io-sign-button";

export default {
  title: "Design System/Button_old",
  component: "io-sign-button",
  argTypes: {
    state: {
      control: "radio",
      options: ["inactive", "activating", "idle", "loading"],
      defaultValue: "idle",
    },
  },
} as Meta<IOSignButtonElementAttributes>;

export const Button: Story<IOSignButtonElementAttributes> = ({ state }) =>
  html`<io-sign-button state=${state}></io-sign-button>`;
