import { Redirect } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "../src/context/AuthContext";

export default function Index() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  if (user) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}
