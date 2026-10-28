import { redirect } from "next/navigation"

export default function Home() {
  // Redirect root visitors directly to the login page
  redirect("/login")
}