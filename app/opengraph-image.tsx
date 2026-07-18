import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/constants";

export const alt = `${SITE_NAME} — AI Interview Preparation`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(145deg, #10241c 0%, #1a3d2e 45%, #2d6a4f 100%)",
          color: "#f4faf6",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            fontWeight: 500,
            opacity: 0.9,
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          Ace every interview with AI-powered practice
        </div>
      </div>
    ),
    { ...size },
  );
}
