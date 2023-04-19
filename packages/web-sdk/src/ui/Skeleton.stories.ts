import { Meta, Story } from "@storybook/web-components";
import { html } from "lit-html";

import "./Skeleton";

export default {
  title: "UI/Skeleton",
  component: "io-skeleton",
  argTypes: {
    backgroundColor: {
      control: { type: "color" },
    },
  },
  decorators: [
    (story) => html`<div style="width: 150px; height: 25px;">${story()}</div>`,
  ],
} as Meta;

type SkeletonArgs = {
  backgroundColor: string;
};

export const Skeleton: Story<SkeletonArgs> = (args) =>
  html` <io-skeleton
    style="--background-color: ${args.backgroundColor}"
  ></io-text-skeleton>`;

Skeleton.args = {
  backgroundColor: "gray",
};
