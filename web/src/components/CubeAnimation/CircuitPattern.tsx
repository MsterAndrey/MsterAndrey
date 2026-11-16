/** Trazas de circuito grabadas en cada cara del cubo (decorativo). */
const TRACES = [
  'M6 28h22l8-8h22',
  'M6 72h16l8 8h22',
  'M94 38H76l-8 8v16',
  'M72 94V82l8-8h14',
  'M40 6v12l6 6',
  'M28 94V84l-6-6',
  'M94 18H84l-6-6V6',
];
const NODES: Array<[number, number]> = [
  [58, 20], [52, 80], [68, 62], [80, 74], [46, 24], [22, 78], [78, 6],
];

export function CircuitPattern({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" preserveAspectRatio="none">
      <g fill="none" stroke="currentColor" strokeWidth="0.7" strokeLinejoin="round">
        {TRACES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g fill="currentColor">
        {NODES.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />
        ))}
      </g>
      {/* Escuadras de esquina */}
      <g fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.9">
        <path d="M3 11V3h8M89 3h8v8M97 89v8h-8M11 97H3v-8" />
      </g>
    </svg>
  );
}
