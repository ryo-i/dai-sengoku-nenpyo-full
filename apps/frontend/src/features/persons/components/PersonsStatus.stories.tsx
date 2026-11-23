import type { Meta, StoryObj } from "@storybook/react";
import { PersonsStatus } from "./PersonsStatus";

const meta = {
  title: "Features/Persons/PersonsStatus",
  component: PersonsStatus,
  tags: ["autodocs"],
} satisfies Meta<typeof PersonsStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    resourceLabel: "人物データ",
    tone: "loading",
  },
};

export const Error: Story = {
  args: {
    resourceLabel: "人物データ",
    tone: "error",
  },
};
