export const sources: Readonly<{
  archive: string; apollo: string; lunarRover: string; alsep: string; surveyor: string;
  sojourner: string; mer: string; viking: string; insight: string; ingenuity: string;
  dawn: string; near: string; pioneer: string; kepler: string;
}>;
export type SourceId = keyof typeof sources;
export const sourceLabels: Readonly<Record<SourceId, string>>;
