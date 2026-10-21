import dynamic from "next/dynamic";
import Head from "next/head";

const App = dynamic(() => import("../src/App"), { 
  ssr: false,
  loading: () => (
    <div style={{
      height: "100vh",
      background: "#0c0513",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#c084f5",
      fontFamily: "sans-serif"
    }}>
      Loading Portfolio...
    </div>
  ),
});

export default function CatchAllPage() {
  return (
    <>
      <Head>
        <title>Garv Rahut | Portfolio</title>
        <meta name="description" content="Personal portfolio showcasing projects, experience, and AI LaTeX resume builder." />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <App />
    </>
  );
}
