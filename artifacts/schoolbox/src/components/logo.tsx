export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="7" fill="#0B2819"/>
      <rect x="8" y="9" width="16" height="2.5" rx="1.25" fill="#4ade80"/>
      <rect x="8" y="14" width="12" height="2.5" rx="1.25" fill="white"/>
      <rect x="8" y="19" width="16" height="2.5" rx="1.25" fill="white"/>
      <rect x="8" y="24" width="9" height="2" rx="1" fill="rgba(255,255,255,0.35)"/>
    </svg>
  );
}

export function SidebarLogo({ portalLabel }: { portalLabel: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <LogoMark size={32} />
      <div>
        <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "14px", color: "white", lineHeight: 1, letterSpacing: "-0.01em" }}>
          SchoolBox
        </p>
        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.1em", color: "#4d7a62", textTransform: "uppercase", marginTop: "3px" }}>
          {portalLabel}
        </p>
      </div>
    </div>
  );
}

export function MobileLogoMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <LogoMark size={26} />
      <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "14px", color: "white", letterSpacing: "-0.01em" }}>
        SchoolBox
      </span>
    </div>
  );
}

export function LoginLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
      <LogoMark size={36} />
      <div>
        <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "16px", color: "white", lineHeight: 1, letterSpacing: "-0.02em" }}>
          SchoolBox
        </p>
        <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", color: "#4d7a62", textTransform: "uppercase", marginTop: "4px" }}>
          Offline Platform
        </p>
      </div>
    </div>
  );
}
