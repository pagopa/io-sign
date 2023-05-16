import { html, nothing } from "lit-html";

import "./Dialog";
import { Meta, StoryFn } from "@storybook/web-components";

type IODialogStoryArgs = {
  withCloseButton?: "false";
};

export default {
  title: "UI/Dialog",
  component: "io-dialog",
  argTypes: {
    withCloseButton: {
      name: "With close button",
      type: "boolean",
      control: {
        type: "boolean",
      },
      defaultValue: false,
    },
  },
} as Meta<IODialogStoryArgs>;

export const Dialog: StoryFn<IODialogStoryArgs> = ({ withCloseButton }) =>
  html`<io-dialog ${withCloseButton ? "with-close-button" : nothing}
    >Ciao!</io-dialog
  >`;
