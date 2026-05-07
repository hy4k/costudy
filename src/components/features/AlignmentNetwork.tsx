/**
 * Live network visualization.
 * Pure SVG with CSS-animated stroke-dashoffset for the "marching ants" feel.
 */
export function AlignmentNetwork() {
  return (
    <div className="relative w-full h-[340px] md:h-[460px] lg:h-[480px] grid place-items-center">
      <svg viewBox="0 0 600 480" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        {/* edges */}
        <line className="net-edge" x1="300" y1="240" x2="120" y2="120" />
        <line className="net-edge" x1="300" y1="240" x2="480" y2="120" />
        <line className="net-edge" x1="300" y1="240" x2="120" y2="360" />
        <line className="net-edge" x1="300" y1="240" x2="480" y2="360" />
        <line className="net-edge" x1="300" y1="240" x2="300" y2="60" />
        <line className="net-edge" x1="300" y1="240" x2="300" y2="420" />
        <line className="net-edge" x1="120" y1="120" x2="60" y2="220" />
        <line className="net-edge" x1="480" y1="120" x2="540" y2="220" />
        <line className="net-edge" x1="120" y1="360" x2="60" y2="280" />
        <line className="net-edge" x1="480" y1="360" x2="540" y2="280" />
        <line className="net-edge" x1="120" y1="120" x2="300" y2="60" />
        <line className="net-edge" x1="480" y1="120" x2="300" y2="60" />
        <line className="net-edge" x1="120" y1="360" x2="300" y2="420" />
        <line className="net-edge" x1="480" y1="360" x2="300" y2="420" />

        {/* central node */}
        <circle className="net-node active" cx="300" cy="240" r="22" />
        <text className="net-label" x="300" y="244" textAnchor="middle" style={{ fill: "#000", fontWeight: 700 }}>
          YOU
        </text>

        {/* primary nodes */}
        <circle className="net-node" cx="120" cy="120" r="14" />
        <text className="net-label" x="120" y="100" textAnchor="middle">CMA P1</text>
        <circle className="net-node" cx="480" cy="120" r="14" />
        <text className="net-label" x="480" y="100" textAnchor="middle">CMA P2</text>
        <circle className="net-node" cx="120" cy="360" r="14" />
        <text className="net-label" x="120" y="384" textAnchor="middle">IELTS</text>
        <circle className="net-node" cx="480" cy="360" r="14" />
        <text className="net-label" x="480" y="384" textAnchor="middle">TOEFL</text>
        <circle className="net-node" cx="300" cy="60" r="12" />
        <text className="net-label" x="300" y="40" textAnchor="middle">GRE</text>
        <circle className="net-node" cx="300" cy="420" r="12" />
        <text className="net-label" x="300" y="448" textAnchor="middle">MENTORS</text>

        {/* satellite nodes */}
        <circle className="net-node" cx="60" cy="220" r="9" />
        <circle className="net-node" cx="540" cy="220" r="9" />
        <circle className="net-node" cx="60" cy="280" r="9" />
        <circle className="net-node" cx="540" cy="280" r="9" />
        <circle className="net-node" cx="200" cy="80" r="6" />
        <circle className="net-node" cx="400" cy="80" r="6" />
        <circle className="net-node" cx="200" cy="400" r="6" />
        <circle className="net-node" cx="400" cy="400" r="6" />
      </svg>
    </div>
  );
}
