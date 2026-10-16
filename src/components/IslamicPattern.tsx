import { Box } from "@mui/material";

/**
 * نمط هندسي إسلامي محلي (SVG) بشفافية منخفضة — بلا صور خارجية ولا حقوق مملوكة.
 * يُستخدم خلف الهيرو والأقسام الرئيسية دون إزعاج القراءة.
 */
export function IslamicPattern({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(PATTERN_SVG)}")`,
        backgroundSize: "220px 220px",
        backgroundRepeat: "repeat",
        maskImage: "radial-gradient(ellipse at 50% 0%, #000 40%, transparent 85%)",
        WebkitMaskImage: "radial-gradient(ellipse at 50% 0%, #000 40%, transparent 85%)",
      }}
    />
  );
}

const PATTERN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <g fill="none" stroke="#1F5D4C" stroke-width="1.4">
    <path d="M110 10 L160 40 L160 100 L110 130 L60 100 L60 40 Z"/>
    <path d="M110 130 L160 160 L160 220 M110 130 L60 160 L60 220"/>
    <path d="M110 40 L135 55 L135 85 L110 100 L85 85 L85 55 Z"/>
    <circle cx="110" cy="70" r="8"/>
    <path d="M0 110 L40 90 M220 110 L180 90 M0 110 L40 130 M220 110 L180 130"/>
    <path d="M110 0 L110 10 M110 210 L110 220"/>
    <circle cx="10" cy="110" r="5"/>
    <circle cx="210" cy="110" r="5"/>
  </g>
  <g fill="#C9A24B" opacity="0.9">
    <circle cx="110" cy="70" r="2.4"/>
    <circle cx="60" cy="40" r="2"/>
    <circle cx="160" cy="40" r="2"/>
  </g>
</svg>`;
