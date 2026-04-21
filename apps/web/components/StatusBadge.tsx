import { type Messages, type MessageKey, t } from "@/lib/i18n";
import type { components } from "@reservation/api-client";

export function StatusBadge({
  state,
  messages,
}: {
  state: components["schemas"]["ReservationState"];
  messages: Messages;
}) {
  const key = `state.${state}` as MessageKey;
  return <span className="pill">{t(messages, key)}</span>;
}
