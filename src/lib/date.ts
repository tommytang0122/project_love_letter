const TIMEZONE = "Asia/Taipei";

export function getToday(): Date {
  const now = new Date();
  const taipeiDate = new Date(
    now.toLocaleDateString("en-CA", { timeZone: TIMEZONE })
  );
  return taipeiDate;
}

export function getTomorrow(): Date {
  const today = getToday();
  today.setDate(today.getDate() + 1);
  return today;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function isAfterMidnightTaipei(): boolean {
  const now = new Date();
  const taipeiHour = parseInt(
    now.toLocaleString("en-US", { timeZone: TIMEZONE, hour: "numeric", hour12: false })
  );
  return taipeiHour >= 0;
}
