import type { Meta, StoryObj } from "@storybook/react";
import { PersonsView } from "./PersonsView";

const meta = {
  title: "Features/Persons/PersonsView",
  component: PersonsView,
  tags: ["autodocs"],
} satisfies Meta<typeof PersonsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    persons: [
      { id: 1, name: "織田信長" },
      { id: 2, name: "豊臣秀吉" },
      { id: 3, name: "徳川家康" },
    ],
  },
};
