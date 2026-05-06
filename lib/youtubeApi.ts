/**
 * Chargement paresseux de l'API YouTube IFrame Player (singleton).
 *
 * Le script https://www.youtube.com/iframe_api expose un objet global
 * `window.YT` une fois charge, puis appelle `window.onYouTubeIframeAPIReady`.
 * On wrap tout ca dans une Promise reutilisable pour simplifier l'usage
 * cote composants React.
 *
 * Usage :
 *
 *   import { loadYouTubeAPI } from "@/lib/youtubeApi";
 *   loadYouTubeAPI().then((YT) => {
 *     const player = new YT.Player(iframeEl, {
 *       events: { onStateChange: (ev) => { if (ev.data === 0) onEnded(); } }
 *     });
 *   });
 */

/* Types minimalistes pour eviter "any" partout. */
export type YouTubePlayer = {
  destroy: () => void;
  getPlayerState: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
};

export type YouTubePlayerOptions = {
  videoId?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YouTubePlayer }) => void;
    onStateChange?: (event: { data: number; target: YouTubePlayer }) => void;
    onError?: (event: { data: number; target: YouTubePlayer }) => void;
  };
};

export type YouTubeAPI = {
  Player: new (
    element: HTMLElement | string,
    options: YouTubePlayerOptions
  ) => YouTubePlayer;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
};

type WindowWithYT = Window & {
  YT?: YouTubeAPI;
  onYouTubeIframeAPIReady?: () => void;
};

let loadPromise: Promise<YouTubeAPI> | null = null;

export function loadYouTubeAPI(): Promise<YouTubeAPI> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTubeAPI : environnement non-navigateur"));
  }

  const w = window as WindowWithYT;
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<YouTubeAPI>((resolve, reject) => {
    /* Chainage : si un autre module avait deja pose le callback, on le */
    /* preserve et on execute en plus notre resolve.                     */
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      try {
        previous?.();
      } catch {
        /* ignore */
      }
      if (w.YT && w.YT.Player) {
        resolve(w.YT);
      } else {
        reject(new Error("YouTubeAPI : chargement incoherent"));
      }
    };

    /* Injection unique du <script> */
    if (!document.querySelector("script[data-yt-api]")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.setAttribute("data-yt-api", "true");
      tag.onerror = () =>
        reject(new Error("YouTubeAPI : echec du chargement du script"));
      document.head.appendChild(tag);
    }
  });

  return loadPromise;
}

export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;
