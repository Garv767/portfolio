import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

const Projects = dynamic(() => import("../src/components/Projects/Projects"), {
  ssr: false,
});

export default function ProjectsPage() {
  return (
    <>
      <Head>
        <title>Projects | Garv Rahut</title>
        <meta name="description" content="Explore software engineering projects built by Garv Rahut." />
      </Head>
      <Projects />
    </>
  );
}
