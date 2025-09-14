export const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date;
};

export const formatDate = (date: Date): string => {
  return date.toISOString();
};
