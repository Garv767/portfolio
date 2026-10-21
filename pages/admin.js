import React from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import ProtectedRoute from "../src/components/Auth/ProtectedRoute";
import { verifyNeonSession } from "../src/utils/neonAuth";

const AdminDashboard = dynamic(
  () => import("../src/components/Admin/AdminDashboard"),
  {
    ssr: false,
  }
);

export default function AdminPage({ initialAuthenticated, initialUser }) {
  return (
    <>
      <Head>
        <title>
          {initialAuthenticated
            ? "Admin Dashboard & Resume Studio | Garv Rahut"
            : "Admin Auth Wall | Garv Rahut"}
        </title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <ProtectedRoute
        initialAuthenticated={initialAuthenticated}
        initialUser={initialUser}
      >
        <AdminDashboard />
      </ProtectedRoute>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await verifyNeonSession(context.req);

  return {
    props: {
      initialAuthenticated: session.authenticated || false,
      initialUser: session.user || null,
    },
  };
}
