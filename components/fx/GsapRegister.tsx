"use client";



import { useLayoutEffect } from "react";

import { ensureScrollTrigger } from "../../lib/gsapMotion";



/** Initialise ScrollTrigger une fois au montage du layout. */

export function GsapRegister() {

  useLayoutEffect(() => {

    ensureScrollTrigger();

  }, []);

  return null;

}


