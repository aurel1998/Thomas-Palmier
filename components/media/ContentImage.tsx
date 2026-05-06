"use client";

import Image from "next/image";
import type { CSSProperties } from "react";

function isOptimizableRemoteUrl(src: string): boolean {
  try {
    const u = new URL(src);
    if (u.protocol !== "https:") return false;
    const h = u.hostname;
    return (
      h === "i.ytimg.com" ||
      h === "img.youtube.com" ||
      h.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}

type ContentImageFill = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  quality?: number;
  fill: true;
  style?: CSSProperties;
};

type ContentImageFixed = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  fill?: false;
  width: number;
  height: number;
  style?: CSSProperties;
};

export type ContentImageProps = ContentImageFill | ContentImageFixed;

/**
 * Image responsive optimisee : Next/Image pour assets locaux et hotes
 * connus (YouTube, Supabase). Fallback `<img>` lazy pour URLs non autorisees
 * (pas de config remotePatterns).
 */
export function ContentImage(props: ContentImageProps) {
  const { src, alt, className, priority, quality = 75, style } = props;
  if (!src) return null;

  const useNext =
    src.startsWith("/") || (src.startsWith("https://") && isOptimizableRemoteUrl(src));

  if (!useNext) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
      />
    );
  }

  if (props.fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        sizes={props.sizes}
        priority={priority}
        quality={quality}
        style={style}
        draggable={false}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={props.width}
      height={props.height}
      className={className}
      sizes={props.sizes}
      priority={priority}
      quality={quality}
      style={style}
      draggable={false}
    />
  );
}
