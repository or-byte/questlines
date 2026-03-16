export const parseDate = (s: string) => {
  const t = s
    .replace(/[\[\]\(\)"]/g, "")
    .trim()
    .replace(" ", "T");
  return t.replace(/\+(\d{2})$/, "+$1:00");
};