import BaseUIIcon from "@workspace/ui/components/icons/baseui-icon";
import CommunityIcon from "@workspace/ui/components/icons/community-icon";
import HeadlessUIIcon from "@workspace/ui/components/icons/headlessui-icon";
import ImageIcon from "@workspace/ui/components/icons/image-icon";
import RadixIcon from "@workspace/ui/components/icons/radix-icon";
import type { BuildPageTreeOptions } from "fumadocs-core/source";
import {
  Code,
  Compass,
  Layers,
  LayoutTemplate,
  ListCollapse,
  MousePointerClick,
  Navigation,
  PlayIcon,
  RectangleHorizontalIcon,
  SparklesIcon,
  SquareMenu,
  TypeIcon,
  Waves,
} from "lucide-react";

import { LucideIcons } from "@/components/lucide-icons";

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-border text-muted-foreground relative flex size-5 items-center justify-center rounded-[5px] [&_svg]:size-3">
    {children}

    <span className="bg-border absolute top-full left-1/2 h-2 w-px translate-x-[calc(-50%-0.5px)]" />
  </span>
);

export const Separator = ({
  icon,
  name,
}: {
  icon: React.ReactNode;
  name: string;
}) => (
  <span className="flex items-center gap-2">
    <Icon>{icon}</Icon>
    <span className="text-[13px] text-neutral-500">{name}</span>
  </span>
);

/** The icon shown beside each sidebar separator, by its title. */
const SEPARATOR_ICONS: Record<string, React.ReactNode> = {
  Overview: <Compass strokeWidth={2.5} />,
  "Radix UI": <RadixIcon className="size-2.5!" />,
  "Base UI": <BaseUIIcon />,
  "Headless UI": <HeadlessUIIcon />,
  Animate: <PlayIcon fill="currentColor" strokeWidth={2.5} />,
  Effects: <SparklesIcon fill="currentColor" />,
  Community: <CommunityIcon />,
  Backgrounds: <ImageIcon strokeWidth={5} />,
  Disclosure: <ListCollapse strokeWidth={2.5} />,
  Overlays: <Layers strokeWidth={2.5} />,
  Buttons: <RectangleHorizontalIcon fill="currentColor" />,
  Interaction: <MousePointerClick strokeWidth={2.5} />,
  Loading: <LayoutTemplate strokeWidth={2.5} />,
  Navigation: <Navigation strokeWidth={2.5} />,
  Texts: <TypeIcon strokeWidth={3} />,
  Shaders: <Waves strokeWidth={2.5} />,
  Icons: <LucideIcons strokeWidth={2} />,
  Usage: <Code strokeWidth={3} />,
  Guide: <Code strokeWidth={2.5} />,
  Menu: <SquareMenu strokeWidth={2} />,
};

export const attachSeparator: BuildPageTreeOptions["attachSeparator"] = (
  node
) => {
  const { name } = node;
  if (typeof name === "string" && Object.hasOwn(SEPARATOR_ICONS, name)) {
    node.name = <Separator icon={SEPARATOR_ICONS[name]} name={name} />;
  }

  return node;
};
