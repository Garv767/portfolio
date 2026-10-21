import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

const Login = dynamic(() => import("../src/components/Auth/Login"), {
  ssr: false,
});

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Admin Login | Garv Rahut</title>
        <meta name="description" content="Admin login portal" />
      </Head>
      <Login />
    </>
  );
}
