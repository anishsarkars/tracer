import type { CSSProperties } from "react";

/** Higgsfield resizer URLs — scenes, seams, sprite sheet. */
export const SCENE_URLS = [
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_023809_d6836117-c958-4680-aa43-1e1973fbc17c.png&w=2400&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_023812_40e3f5f5-a613-4a33-9c78-4cab8b04a992.png&w=2400&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_023814_b2c8f33a-3c90-4aa1-bb91-cce7f0deb878.png&w=2400&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_023817_3e21faea-ad1c-4723-be92-9b22692094e1.png&w=2400&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_023819_5b21be3d-159e-4d1d-a3b3-80339bc5d5f1.png&w=2400&q=85",
] as const;

export const SEAM_URLS = [
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_025938_e54c50c3-9748-4d00-af68-886bef6e65e7.png&w=2400&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_030022_7a86d576-94d5-4069-b515-62547af3b50c.png&w=2400&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_025940_a85237c9-d7e3-4c28-b1d9-71ad7d8cbca4.png&w=2400&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_025942_debc2172-5187-4ad4-af0d-307c5e0277b5.png&w=2400&q=85",
] as const;

export const SPRITE_SHEET =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261029_023917_156ac3d3-e103-4a95-947d-07554914ab0b.png&w=1024&q=85";

export type SpriteCrop = [x: number, y: number, w: number, h: number];

export const SPRITES: Record<string, SpriteCrop> = {
  ghost1: [39, 103, 204, 221],
  ghost2: [303, 122, 152, 212],
  ghost3: [538, 125, 208, 201],
  ghost4: [833, 70, 131, 280],
  batUp: [41, 389, 203, 221],
  batDown: [299, 389, 195, 221],
};

export function spriteStyle(crop: SpriteCrop): CSSProperties {
  const [x, y, w, h] = crop;
  const sheetW = 1024;
  const sheetH = 688;
  return {
    aspectRatio: `${w} / ${h}`,
    backgroundImage: `url('${SPRITE_SHEET}')`,
    backgroundSize: `${(sheetW / w) * 100}% ${(sheetH / h) * 100}%`,
    backgroundPosition: `${sheetW === w ? 0 : (x / (sheetW - w)) * 100}% ${sheetH === h ? 0 : (y / (sheetH - h)) * 100}%`,
    backgroundRepeat: "no-repeat",
    filter: "drop-shadow(0 0 10px rgba(170,235,255,.45))",
  };
}
