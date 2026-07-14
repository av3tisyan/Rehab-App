import type { BodySide } from '@rehab/shared';
import classes from './BodyDiagram.module.css';

export interface JointTarget {
  id: string;
  labelKey: string;
  regions: string[]; // rom_norms body_region(s) covered by this joint
  side: BodySide;
  x: number;
  y: number;
}

// Schematic anterior figure. Positions are in the 240×430 viewBox.
export const JOINTS: JointTarget[] = [
  { id: 'cervical', labelKey: 'Neck', regions: ['cervical_spine'], side: 'bilateral', x: 120, y: 70 },
  { id: 'shoulder_r', labelKey: 'Shoulder', regions: ['shoulder'], side: 'right', x: 82, y: 116 },
  { id: 'shoulder_l', labelKey: 'Shoulder', regions: ['shoulder'], side: 'left', x: 158, y: 116 },
  { id: 'elbow_r', labelKey: 'Elbow', regions: ['elbow', 'forearm'], side: 'right', x: 66, y: 178 },
  { id: 'elbow_l', labelKey: 'Elbow', regions: ['elbow', 'forearm'], side: 'left', x: 174, y: 178 },
  { id: 'wrist_r', labelKey: 'Wrist', regions: ['wrist'], side: 'right', x: 54, y: 236 },
  { id: 'wrist_l', labelKey: 'Wrist', regions: ['wrist'], side: 'left', x: 186, y: 236 },
  { id: 'lumbar', labelKey: 'Low back', regions: ['lumbar_spine'], side: 'bilateral', x: 120, y: 208 },
  { id: 'hip_r', labelKey: 'Hip', regions: ['hip'], side: 'right', x: 100, y: 250 },
  { id: 'hip_l', labelKey: 'Hip', regions: ['hip'], side: 'left', x: 140, y: 250 },
  { id: 'knee_r', labelKey: 'Knee', regions: ['knee'], side: 'right', x: 96, y: 320 },
  { id: 'knee_l', labelKey: 'Knee', regions: ['knee'], side: 'left', x: 144, y: 320 },
  { id: 'ankle_r', labelKey: 'Ankle', regions: ['ankle'], side: 'right', x: 92, y: 392 },
  { id: 'ankle_l', labelKey: 'Ankle', regions: ['ankle'], side: 'left', x: 148, y: 392 },
];

interface Props {
  activeId: string | null;
  measuredJointIds: Set<string>;
  onSelect: (joint: JointTarget) => void;
}

export function BodyDiagram({ activeId, measuredJointIds, onSelect }: Props) {
  return (
    <svg viewBox="0 0 240 430" className={classes.svg} role="img" aria-label="Body diagram">
      {/* Silhouette */}
      <g className={classes.silhouette}>
        <circle cx="120" cy="42" r="22" />
        <rect x="96" y="64" width="48" height="20" rx="10" />
        {/* torso */}
        <path d="M84 96 Q120 84 156 96 L150 210 Q120 224 90 210 Z" />
        {/* arms */}
        <path d="M86 112 L60 178 L50 238" />
        <path d="M154 112 L180 178 L190 238" />
        {/* legs */}
        <path d="M104 208 L96 320 L92 396" />
        <path d="M136 208 L144 320 L148 396" />
      </g>

      {/* Joint hit targets */}
      {JOINTS.map((j) => {
        const measured = measuredJointIds.has(j.id);
        const active = activeId === j.id;
        return (
          <g
            key={j.id}
            className={classes.joint}
            data-active={active || undefined}
            data-measured={measured || undefined}
            onClick={() => onSelect(j)}
            role="button"
            aria-label={`${j.labelKey} ${j.side}`}
          >
            {/* Large transparent touch area (>=44px) */}
            <circle cx={j.x} cy={j.y} r="22" className={classes.hit} />
            <circle cx={j.x} cy={j.y} r="11" className={classes.dot} />
          </g>
        );
      })}
    </svg>
  );
}
