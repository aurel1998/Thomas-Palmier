import type { Metadata } from "next";

import { AProposClient } from "../../components/a-propos/AProposClient";

import {

  getCredibilityItemsServer,

  getJournalistProfileServer,

  getTimelineStepsServer,

} from "../../lib/editorialServer";

import { PROFILE_PORTRAIT_SRC } from "../../lib/profileAssets";
import { buildPageMetadata } from "../../lib/seo";



export const metadata: Metadata = buildPageMetadata({

  title: "À propos",

  description:

    "Portrait et parcours de Thomas Palmier, journaliste sportif : terrain, ligne éditoriale et formats multimédias.",

  path: "/a-propos",

});



export default async function AProposPage() {

  const [profile, timeline, credibility] = await Promise.all([

    getJournalistProfileServer(),

    getTimelineStepsServer(),

    getCredibilityItemsServer({ activeOnly: true }),

  ]);



  const awards = credibility.filter((item) => item.kind === "award");
  const media = credibility.filter((item) => item.kind === "media");

  return (
    <AProposClient
      profileImageUrl={profile.image_url?.trim() || PROFILE_PORTRAIT_SRC}
      displayName={profile.display_name}
      jobTitle={profile.job_title}
      tagline={profile.tagline}
      photoCaption={profile.photo_caption}
      bio={profile.bio}
      specialties={profile.specialties}
      editorialLine={profile.editorial_line}
      timeline={timeline}
      awards={awards}
      media={media}
    />
  );

}

