import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

const Home = dynamic(() => import("../src/components/Home/Home"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Garv Rahut | Portfolio</title>
        <meta
          name="description"
          content="Personal portfolio showcasing projects, experience, and AI LaTeX resume builder."
        />
      </Head>
      <Home />
    </>
  );
}
