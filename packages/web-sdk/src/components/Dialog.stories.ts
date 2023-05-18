import { html, nothing } from "lit-html";

import "./Dialog";
import { Meta, StoryFn } from "@storybook/web-components";

type IODialogStoryArgs = {
  disableClose?: "false";
};

export default {
  title: "UI/Dialog",
  component: "io-dialog",
  argTypes: {
    disableClose: {
      name: "Disable close",
      type: "boolean",
      control: {
        type: "boolean",
      },
      defaultValue: false,
    },
  },
} as Meta<IODialogStoryArgs>;

export const Dialog: StoryFn<IODialogStoryArgs> = ({ disableClose }) =>
  html`<io-dialog ${disableClose ? "disable-close" : nothing}
    >Ciao!</io-dialog
  >`;
