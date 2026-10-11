import { redirect } from "next/navigation";

export default function StudentRootRedirect() {
  redirect("/student/dashboard");
}
