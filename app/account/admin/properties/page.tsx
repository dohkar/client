import { redirect } from "next/navigation";

/** Старый путь админки объявлений (Property) → модерация листингов. */
export default function AdminPropertiesLegacyRedirect() {
  redirect("/account/admin/listings");
}
