import { redirect } from "next/navigation";

export default function DirectorRootRedirect() {
  redirect("/director/dashboard");
}
