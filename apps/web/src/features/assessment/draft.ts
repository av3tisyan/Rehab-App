import type { AssessmentItem } from '../../lib/types';
import type { JointTarget } from './BodyDiagram';

/** Stable key so re-editing a measurement updates the same draft entry. */
export function itemKey(item: AssessmentItem): string {
  return `${item.typeCode}|${item.bodyRegion ?? ''}|${item.side ?? ''}|${item.measureKind ?? ''}`;
}

/** Which joints on the diagram already have at least one draft measurement. */
export function measuredJointIds(
  joints: JointTarget[],
  draft: Map<string, AssessmentItem>,
): Set<string> {
  const regionsWithData = new Set<string>();
  for (const item of draft.values()) {
    if (item.bodyRegion) regionsWithData.add(`${item.bodyRegion}|${item.side}`);
  }
  const result = new Set<string>();
  for (const j of joints) {
    if (j.regions.some((r) => regionsWithData.has(`${r}|${j.side}`))) result.add(j.id);
  }
  return result;
}
