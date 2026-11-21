import { index } from "@/__registry__";

type InspirationType = "inspired" | "reimplemented" | "adapted";

interface RegistryInspiration {
  label: string;
  stack?: string;
  type: InspirationType;
  url?: string;
}

interface ComponentCreditsProps {
  name: string;
}

const InspirationSource = ({ label, url }: { label: string; url?: string }) => {
  if (!url) {
    return <span className="text-foreground font-medium">{label}</span>;
  }

  return (
    <a
      className="text-foreground hover:text-foreground/80 font-medium underline underline-offset-2 transition-colors"
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      {label}
    </a>
  );
};

const getInspirationText = (inspiration: RegistryInspiration) => {
  const source = (
    <InspirationSource label={inspiration.label} url={inspiration.url} />
  );

  if (inspiration.type === "reimplemented") {
    const stack = inspiration.stack ?? "Motion and React";
    return (
      <>
        Inspired by {source}. Reimplemented for {stack}.
      </>
    );
  }

  if (inspiration.type === "adapted") {
    return (
      <>
        Ported from {source} and reworked for Wirefront. The code from {source}{" "}
        keeps its MIT notice.
      </>
    );
  }

  return <>Inspired by {source}.</>;
};

export const ComponentCredits = ({ name }: ComponentCreditsProps) => {
  const inspiration = (
    index as Record<string, { inspiration?: RegistryInspiration | null }>
  )[name]?.inspiration;

  if (!inspiration) {
    return null;
  }

  return (
    <p className="text-fd-muted-foreground text-sm leading-relaxed">
      {getInspirationText(inspiration)}
    </p>
  );
};
