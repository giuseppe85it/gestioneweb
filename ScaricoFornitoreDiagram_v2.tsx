function ScaricoFornitoreDiagram(props: {
  area: EuromeccAreaStatic;
  snapshot: EuromeccSnapshot;
  currentSub: string | null;
  onSelectSub: (key: string) => void;
}) {
  return (
    <svg width="100%" viewBox="0 0 680 780" className="eur-silo-diagram">

      <rect x="0" y="0" width="680" height="780" fill="#E8EFF6" opacity="0.3"/>

      {/* RINGHIERA CIMA */}
      <line x1="208" y1="32" x2="480" y2="32" stroke="#8A9099" strokeWidth="2.5"/>
      <line x1="208" y1="22" x2="480" y2="22" stroke="#8A9099" strokeWidth="1.5"/>
      <line x1="208" y1="22" x2="208" y2="42" stroke="#8A9099" strokeWidth="2"/>
      <line x1="270" y1="22" x2="270" y2="42" stroke="#8A9099" strokeWidth="2"/>
      <line x1="344" y1="22" x2="344" y2="42" stroke="#8A9099" strokeWidth="2"/>
      <line x1="418" y1="22" x2="418" y2="42" stroke="#8A9099" strokeWidth="2"/>
      <line x1="480" y1="22" x2="480" y2="42" stroke="#8A9099" strokeWidth="2"/>

      {/* CALOTTA */}
      <ellipse cx="344" cy="42" rx="136" ry="24" fill="#C8CDD4" stroke="#8A9099" strokeWidth="2"/>
      <ellipse cx="344" cy="42" rx="136" ry="24" fill="#D8DDE4" opacity="0.4"/>

      {/* CORPO CILINDRICO */}
      <rect x="208" y="42" width="272" height="330" fill="#D2D7DE" stroke="#8A9099" strokeWidth="2"/>
      <rect x="208" y="42" width="42" height="330" fill="#E4E8EE" opacity="0.6"/>
      <rect x="438" y="42" width="42" height="330" fill="#A8ADB4" opacity="0.4"/>

      {/* ANELLI RINFORZO */}
      <rect x="208" y="90" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="145" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="200" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="255" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="310" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="365" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>

      {/* BULLONI */}
      <circle cx="218" cy="93" r="2.5" fill="#8A9099" opacity="0.7"/>
      <circle cx="235" cy="93" r="2.5" fill="#8A9099" opacity="0.7"/>
      <circle cx="462" cy="93" r="2.5" fill="#8A9099" opacity="0.7"/>
      <circle cx="448" cy="93" r="2.5" fill="#8A9099" opacity="0.7"/>
      <circle cx="218" cy="148" r="2.5" fill="#8A9099" opacity="0.7"/>
      <circle cx="462" cy="148" r="2.5" fill="#8A9099" opacity="0.7"/>
      <circle cx="218" cy="258" r="2.5" fill="#8A9099" opacity="0.7"/>
      <circle cx="462" cy="258" r="2.5" fill="#8A9099" opacity="0.7"/>
      <circle cx="218" cy="313" r="2.5" fill="#8A9099" opacity="0.7"/>
      <circle cx="462" cy="313" r="2.5" fill="#8A9099" opacity="0.7"/>

      {/* COSTOLE VERTICALI */}
      <line x1="260" y1="42" x2="260" y2="372" stroke="#A0A8B2" strokeWidth="1" opacity="0.35"/>
      <line x1="312" y1="42" x2="312" y2="372" stroke="#A0A8B2" strokeWidth="1" opacity="0.35"/>
      <line x1="376" y1="42" x2="376" y2="372" stroke="#A0A8B2" strokeWidth="1" opacity="0.35"/>
      <line x1="428" y1="42" x2="428" y2="372" stroke="#A0A8B2" strokeWidth="1" opacity="0.35"/>

      {/* CONO DI SCARICO */}
      <polygon points="198,372 480,372 428,498 250,498" fill="#B8BEC6" stroke="#8A9099" strokeWidth="2"/>
      <polygon points="198,372 250,372 235,498 198,490" fill="#CDD2D8" opacity="0.5"/>
      <rect x="198" y="368" width="282" height="9" rx="1" fill="#9A9FA8" stroke="#8A9099" strokeWidth="1"/>
      <line x1="228" y1="372" x2="262" y2="498" stroke="#8A9099" strokeWidth="1.5" opacity="0.45"/>
      <line x1="280" y1="372" x2="280" y2="498" stroke="#8A9099" strokeWidth="1.5" opacity="0.45"/>
      <line x1="344" y1="372" x2="330" y2="498" stroke="#8A9099" strokeWidth="1.5" opacity="0.45"/>
      <line x1="408" y1="372" x2="380" y2="498" stroke="#8A9099" strokeWidth="1.5" opacity="0.45"/>
      <line x1="452" y1="372" x2="420" y2="498" stroke="#8A9099" strokeWidth="1.5" opacity="0.45"/>
      <rect x="246" y="428" width="182" height="6" rx="1" fill="#9A9FA8" stroke="#8A9099" strokeWidth="0.8" opacity="0.7"/>

      {/* STRUTTURA PORTANTE */}
      <rect x="216" y="498" width="12" height="195" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1"/>
      <rect x="278" y="498" width="12" height="195" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1"/>
      <rect x="400" y="498" width="12" height="195" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1"/>
      <rect x="460" y="498" width="12" height="195" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1"/>
      <rect x="216" y="535" width="256" height="8" rx="1" fill="#8A9099" opacity="0.55"/>
      <rect x="216" y="585" width="256" height="8" rx="1" fill="#8A9099" opacity="0.55"/>
      <rect x="216" y="635" width="256" height="8" rx="1" fill="#8A9099" opacity="0.55"/>
      <line x1="228" y1="498" x2="472" y2="543" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="472" y1="498" x2="228" y2="543" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="228" y1="543" x2="472" y2="593" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="472" y1="543" x2="228" y2="593" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="228" y1="593" x2="472" y2="643" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="472" y1="593" x2="228" y2="643" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>

      {/* BASI PILASTRI */}
      <rect x="208" y="688" width="28" height="14" rx="2" fill="#8A9099" opacity="0.6"/>
      <rect x="270" y="688" width="28" height="14" rx="2" fill="#8A9099" opacity="0.6"/>
      <rect x="392" y="688" width="28" height="14" rx="2" fill="#8A9099" opacity="0.6"/>
      <rect x="452" y="688" width="28" height="14" rx="2" fill="#8A9099" opacity="0.6"/>

      {/* PIATTAFORMA */}
      <rect x="186" y="496" width="314" height="10" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1.2"/>

      {/* TUBAZIONI VERTICALI SINISTRA */}
      <rect x="148" y="55" width="16" height="648" rx="3" fill="#B8BEC6" stroke="#8A9099" strokeWidth="1.5"/>
      <rect x="148" y="55" width="5" height="648" fill="#D0D5DC" opacity="0.55"/>
      <rect x="168" y="55" width="14" height="628" rx="3" fill="#B0B8C4" stroke="#8A9099" strokeWidth="1.2"/>
      <rect x="186" y="55" width="10" height="445" rx="2" fill="#A8ADB4" stroke="#8A9099" strokeWidth="1"/>

      {/* FLANGE TUBI */}
      <rect x="145" y="115" width="54" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
      <rect x="145" y="215" width="54" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
      <rect x="145" y="315" width="54" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
      <rect x="145" y="415" width="54" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
      <rect x="145" y="515" width="42" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
      <rect x="145" y="615" width="36" height="5" rx="1" fill="#8A9099" opacity="0.65"/>

      {/* SCALA ACCESSO */}
      <line x1="130" y1="55" x2="130" y2="506" stroke="#8A9099" strokeWidth="2" opacity="0.55"/>
      <line x1="120" y1="55" x2="120" y2="506" stroke="#8A9099" strokeWidth="2" opacity="0.55"/>
      <line x1="120" y1="88" x2="130" y2="88" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="108" x2="130" y2="108" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="128" x2="130" y2="128" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="148" x2="130" y2="148" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="168" x2="130" y2="168" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="188" x2="130" y2="188" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="208" x2="130" y2="208" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="228" x2="130" y2="228" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="248" x2="130" y2="248" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="268" x2="130" y2="268" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="288" x2="130" y2="288" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="308" x2="130" y2="308" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="328" x2="130" y2="328" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="348" x2="130" y2="348" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="368" x2="130" y2="368" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="388" x2="130" y2="388" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="408" x2="130" y2="408" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="428" x2="130" y2="428" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="460" x2="130" y2="460" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="120" y1="490" x2="130" y2="490" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>

      {/* QUADRO FR */}
      <rect x="54" y="518" width="72" height="95" rx="5" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.8"/>
      <rect x="54" y="518" width="72" height="18" rx="5" fill="#9A9FA8"/>
      <text fontSize="11" x="90" y="531" textAnchor="middle" fill="#F0EEE8">FR</text>
      <circle cx="74" cy="554" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="90" cy="554" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="106" cy="554" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="74" cy="572" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="90" cy="572" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="106" cy="572" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="74" cy="590" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="90" cy="590" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="106" cy="590" r="5" fill="#8A9099" opacity="0.7"/>
      <line x1="126" y1="562" x2="148" y2="562" stroke="#8A9099" strokeWidth="1.5" opacity="0.6"/>

      {/* TARGHETTA NUMERAZIONE */}
      <rect x="322" y="598" width="38" height="76" rx="3" fill="#F4F2EC" stroke="#8A9099" strokeWidth="1"/>
      <text fontSize="11" x="341" y="616" textAnchor="middle" fill="#3A3A38">5</text>
      <text fontSize="11" x="341" y="634" textAnchor="middle" fill="#3A3A38">6B</text>
      <text fontSize="11" x="341" y="652" textAnchor="middle" fill="#3A3A38">6A</text>
      <text fontSize="11" x="341" y="670" textAnchor="middle" fill="#3A3A38">7</text>

      {/* SUOLO */}
      <rect x="0" y="702" width="680" height="78" fill="#B8B4A8" opacity="0.38"/>
      <line x1="0" y1="702" x2="680" y2="702" stroke="#A0998A" strokeWidth="2.5"/>
      <line x1="0" y1="720" x2="680" y2="720" stroke="#A0998A" strokeWidth="0.5" opacity="0.4"/>

      {/* HOTSPOT */}
      {SCARICO_FORNITORE_HOTSPOTS.map((spot) => {
        const status = getSubStatus(
          props.area.key,
          spot.key,
          props.area.components.find((item) => item.key === spot.key)?.base ?? props.area.base,
          props.snapshot,
        );
        const active = props.currentSub === spot.key;
        const cx = spot.dotX ?? (spot.x + spot.width / 2);
        const cy = spot.dotY ?? (spot.y + spot.height / 2);
        const hasLeader = spot.labelX !== undefined && spot.labelY !== undefined;
        if (!hasLeader) return null;
        return (
          <g key={spot.key}
            className={`eur-hotspot ${active ? "active" : ""}`}
            onClick={() => props.onSelectSub(spot.key)}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onSelectSub(spot.key); }}}
            style={{ cursor: "pointer" }}>
            <line x1={cx} y1={cy} x2={spot.labelX} y2={spot.labelY}
              stroke={STATUS_COLORS[status]} strokeWidth="1" strokeDasharray="4 3" opacity="0.7"/>
            <circle cx={cx} cy={cy} r="7"
              fill={STATUS_COLORS[status]}
              stroke={active ? "#0f6fff" : "white"}
              strokeWidth={active ? "3" : "1.5"}/>
            <circle cx={cx} cy={cy} r="18" fill="transparent"/>
            <text x={spot.labelX} y={(spot.labelY ?? 0) - 6}
              className="eur-hotspot-label" fontSize="12"
              fill="var(--color-text-primary)"
              fontWeight={active ? "600" : "400"}>{spot.label}</text>
            <text x={spot.labelX} y={(spot.labelY ?? 0) + 8}
              className="eur-hotspot-status" fontSize="11"
              fill={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</text>
          </g>
        );
      })}
    </svg>
  );
}
