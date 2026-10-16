import { useEffect } from "react";
import { PROJECT_NAME } from "../constants/dedication";

/** يضبط عنوان المستند لصفحات SPA: "صدقة جارية | القرآن الكريم". */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${PROJECT_NAME} | ${title}` : PROJECT_NAME;
  }, [title]);
}
