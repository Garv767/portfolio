import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

const Resume = dynamic(() => import("../src/components/Resume/ResumeNew"), {
  ssr: false,
});

export default function ResumePage() {
  return (
    <>
      <Head>
        <title>Resume | Garv Rahut</title>
        <meta name="description" content="View and download Garv Rahut's latest CV and resume." />
      </Head>
      <Resume />
    </>
  );
}
