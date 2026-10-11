import { redirect } from "next/navigation";

export default function WardenRootRedirect() {
  redirect("/warden/dashboard");
}
