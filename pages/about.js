import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

const About = dynamic(() => import("../src/components/About/About"), {
  ssr: false,
});

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About | Garv Rahut</title>
        <meta name="description" content="Learn more about Garv Rahut, skills, tools, and background." />
      </Head>
      <About />
    </>
  );
}
