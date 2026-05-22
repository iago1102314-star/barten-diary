function isMissingColumnError(message: string, column: string): boolean {
  return (
    message.includes(column) &&
    (message.includes("does not exist") ||
      message.includes("Could not find") ||
      message.includes("schema cache"))
  );
}

export function isContinuedFromColumnMissing(message: string): boolean {
  return (
    isMissingColumnError(message, "continued_from_diary_id") ||
    isMissingColumnError(message, "continued_from_bottle_tag") ||
    (message.includes("continued_from") &&
      (message.includes("Could not find") || message.includes("schema cache")))
  );
}

export function isDrinkNoteColumnMissing(message: string): boolean {
  return isMissingColumnError(message, "drink_note");
}
