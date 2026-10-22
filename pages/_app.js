import React, { useState, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "../src/style.css";
import "../src/App.css";
import "../src/index.css";

import Preloader from "../src/components/Pre";
import Navbar from "../src/components/Navbar";
import Footer from "../src/components/Footer";
import ScrollToTop from "../src/components/ScrollToTop";

import { useRouter } from "next/router";

export default function MyApp({ Component, pageProps }) {
  const [load, updateLoad] = useState(true);
  const router = useRouter();
  const isAdmin = router.pathname.startsWith("/admin");

  useEffect(() => {
    const timer = setTimeout(() => {
      updateLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>Garv Rahut | Portfolio</title>
        <meta
          name="description"
          content="Personal portfolio showcasing projects, experience, and AI LaTeX resume builder."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Preloader load={load} />
      <div className="App" id={load ? "no-scroll" : "scroll"}>
        <Navbar />
        <ScrollToTop />
        <Component {...pageProps} />
        {!isAdmin && <Footer />}
      </div>
    </>
  );
}
