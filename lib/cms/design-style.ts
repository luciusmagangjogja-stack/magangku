import type { CSSProperties } from "react";
import type { DesignTokens } from "./types";

export function getPublicDesignStyle(tokens: DesignTokens): CSSProperties {
  const fontFamily = tokens.typography.fontFamily === "hey-comic"
    ? '"Hey Comic", "Comic Sans MS", cursive'
    : '"Segoe UI", Tahoma, sans-serif';

  return {
    "--color-primary": tokens.colors.primary,
    "--color-secondary": tokens.colors.secondary,
    "--color-text": tokens.colors.text,
    "--color-copy": tokens.colors.muted,
    "--color-green": tokens.colors.secondary,
    "--color-soft-green": tokens.colors.surface,
    "--color-soft-orange": tokens.colors.accent,
    "--color-background": tokens.colors.background,
    "--color-surface": tokens.colors.surface,
    "--color-border": tokens.colors.border,
    "--content-width": `${tokens.layout.contentWidth}px`,
    "--font-body": fontFamily,
    "--type-base-size": `${tokens.typography.baseSize}px`,
    "--type-heading-size": `${tokens.typography.headingSize}px`,
    "--type-section-heading-size": `${tokens.typography.headingSize * (5 / 6)}px`,
    "--type-contact-heading-size": `${tokens.typography.headingSize * (2 / 3)}px`,
    "--type-paragraph-size": `${tokens.typography.paragraphSize}px`,
    "--type-line-height": String(tokens.typography.lineHeight),
    "--layout-section-padding": `${tokens.layout.sectionPadding}px`,
    "--layout-element-spacing": `${tokens.layout.elementSpacing}px`,
    "--shape-border-radius": `${tokens.shape.borderRadius}px`,
    "--shape-button-radius": `${tokens.shape.buttonRadius}px`,
    "--shape-card-radius": `${tokens.shape.cardRadius}px`,
  } as CSSProperties;
}