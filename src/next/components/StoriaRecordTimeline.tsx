import type { CSSProperties, ReactElement } from "react";

import type { StoriaRecordData, StoriaRecordSegment } from "../helpers/storiaRecord";

type Props = {
  storia: StoriaRecordData | null;
  compact?: boolean;
  style?: CSSProperties;
};

function collectSegments(storia: StoriaRecordData): StoriaRecordSegment[] {
  return [storia.segnalazione, storia.presaInCarico, storia.esecuzione].filter(
    (segment): segment is StoriaRecordSegment => Boolean(segment),
  );
}

export function StoriaRecordTimeline({ storia, compact = false, style }: Props): ReactElement | null {
  if (!storia) return null;
  const segments = collectSegments(storia);
  if (segments.length === 0) return null;

  return (
    <div
      style={{
        marginTop: compact ? 6 : 10,
        color: "#4b5563",
        fontSize: compact ? 12 : 13,
        lineHeight: 1.45,
        ...style,
      }}
    >
      {segments.map((segment, index) => (
        <span key={`${segment.label}-${index}`} title={segment.title}>
          {index > 0 ? " - " : ""}
          {segment.label}
        </span>
      ))}
    </div>
  );
}
