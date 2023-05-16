import { html } from "lit-html";

import "./Dialog";
import { Meta, StoryFn } from "@storybook/web-components";

type IODialogStoryArgs = {
  showCloseButton?: "false";
};

export default {
  title: "UI/Dialog",
  component: "io-dialog",
  argTypes: {
    showCloseButton: {
      name: "Show close button",
      type: "boolean",
      control: {
        type: "boolean",
      },
      defaultValue: false,
    },
  },
} as Meta<IODialogStoryArgs>;

export const Dialog: StoryFn<IODialogStoryArgs> = ({ showCloseButton }) =>
  html`<io-dialog show-close-button="${showCloseButton ? "true" : "false"}"
    >Ciao!</io-dialog
  >`;
