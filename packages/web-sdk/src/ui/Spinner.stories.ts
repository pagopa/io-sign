import { Meta, Story } from "@storybook/web-components";
import { html } from "lit-html";
import { styleMap } from "lit/directives/style-map.js";

import "./Spinner";

type IOSpinnerStoryArgs = {
  color: "string";
};

export default {
  title: "UI/Spinner",
  component: "io-spinner",
  argTypes: {
    color: {
      control: { type: "color" },
      defaultValue: "blue",
    },
  },
} as Meta<IOSpinnerStoryArgs>;

export const Spinner: Story<IOSpinnerStoryArgs> = ({ color }) => {
  const styles = {
    "--io-spinner-color": color,
  };
  return html`<io-spinner style=${styleMap(styles)}></io-spinner>`;
};
