import { Meta, StoryFn } from "@storybook/web-components";
import { html } from "lit-html";
import { styleMap } from "lit/directives/style-map.js";

import "./Spinner";

type IOSpinnerStoryArgs = {
  color: "string";
  size: "string";
};

export default {
  title: "UI/Spinner",
  component: "io-spinner",
  argTypes: {
    color: {
      control: { type: "color" },
      defaultValue: "blue",
    },
    size: {
      type: "string",
      defaultValue: "20px",
    },
  },
} as Meta<IOSpinnerStoryArgs>;

export const Spinner: StoryFn<IOSpinnerStoryArgs> = ({ color, size }) => {
  const styles = {
    "--io-spinner-color": color,
    "--io-spinner-size": size,
  };
  return html`<io-spinner style=${styleMap(styles)}></io-spinner>`;
};
