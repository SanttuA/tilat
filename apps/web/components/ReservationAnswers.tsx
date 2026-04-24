import type { components } from "@reservation/api-client";

import type { Messages } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { reservationFormFieldKeys, reservationFormFieldLabels } from "@/lib/reservation-form";

export function ReservationAnswers({
  answers,
  messages,
}: {
  answers: components["schemas"]["ReservationFormAnswers"];
  messages: Messages;
}) {
  const visibleAnswers = reservationFormFieldKeys.flatMap((key) => {
    const value = answers[key];
    return value ? [{ key, value }] : [];
  });

  if (visibleAnswers.length === 0) {
    return <span>{t(messages, "reservationForm.noAnswers")}</span>;
  }

  return (
    <dl className="answer-list">
      {visibleAnswers.map((answer) => (
        <div key={answer.key}>
          <dt>{t(messages, reservationFormFieldLabels[answer.key])}</dt>
          <dd>{answer.value}</dd>
        </div>
      ))}
    </dl>
  );
}
