import { redirect } from "next/navigation";

/** Старый путь админки объявлений (Property) → модерация листингов. */
export default function AdminPropertiesLegacyRedirect() {
  redirect("/dashboard/admin/listings");
}
