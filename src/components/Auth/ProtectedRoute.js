import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../utils/supabaseClient";
import Preloader from "../Pre";

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null && process.env.NODE_ENV === "production") {
      router.replace("/login");
    }
  }, [session, router]);

  // Still checking session — show preloader
  if (session === undefined) {
    return <Preloader load={true} />;
  }

  // Not logged in (in production)
  if (!session && process.env.NODE_ENV === "production") {
    return <Preloader load={true} />;
  }

  return children;
};

export default ProtectedRoute;
