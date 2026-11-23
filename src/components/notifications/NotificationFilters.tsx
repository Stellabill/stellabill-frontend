import { useTranslation } from "react-i18next";
import type { NotificationCategory } from "./types";

export type NotificationCategoryFilter = NotificationCategory | "all";

interface NotificationFiltersProps {
  category: NotificationCategoryFilter;
  unreadOnly: boolean;
  onCategoryChange: (category: NotificationCategoryFilter) => void;
  onUnreadOnlyChange: (unreadOnly: boolean) => void;
}

export default function NotificationFilters({
  category,
  unreadOnly,
  onCategoryChange,
  onUnreadOnlyChange,
}: NotificationFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="notifications-filters">
      <label className="notifications-filter-category">
        <span>{t("notifications.filters.category")}</span>
        <select
          value={category}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (
              value === "all" ||
              value === "failed-charge" ||
              value === "low-balance" ||
              value === "plan-change"
            ) {
              onCategoryChange(value);
            }
          }}
        >
          <option value="all">{t("notifications.filters.allCategories")}</option>
          <option value="failed-charge">
            {t("notifications.filters.failedCharges")}
          </option>
          <option value="low-balance">
            {t("notifications.filters.lowBalance")}
          </option>
          <option value="plan-change">
            {t("notifications.filters.planChanges")}
          </option>
        </select>
      </label>
      <label className="notifications-filter-unread">
        <input
          type="checkbox"
          checked={unreadOnly}
          onChange={(event) => onUnreadOnlyChange(event.target.checked)}
        />
        <span>{t("notifications.filters.unreadOnly")}</span>
      </label>
    </div>
  );
}
