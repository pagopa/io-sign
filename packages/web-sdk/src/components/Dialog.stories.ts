import { html, nothing } from "lit-html";

import "./Dialog";
import { Meta, StoryFn } from "@storybook/web-components";

type IODialogStoryArgs = {
  withoutCloseButton?: "false";
};

export default {
  title: "UI/Dialog",
  component: "io-dialog",
  argTypes: {
    withoutCloseButton: {
      name: "Without close button",
      type: "boolean",
      control: {
        type: "boolean",
      },
      defaultValue: false,
    },
  },
} as Meta<IODialogStoryArgs>;

export const Dialog: StoryFn<IODialogStoryArgs> = ({ withoutCloseButton }) =>
  html`<io-dialog ${withoutCloseButton ? "without-close-button" : nothing}
    >Ciao!</io-dialog
  >`;
