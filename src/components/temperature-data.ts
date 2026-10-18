export function filterDataByTimePeriod(
  data: Temperature[],
  timePeriod: string,
  now = new Date(),
): Temperature[] {
  let msAgo;
  switch (timePeriod) {
    case 'day':
      msAgo = 24 * 60 * 60 * 1000;
      break;
    case 'month':
      msAgo = 30 * 24 * 60 * 60 * 1000;
      break;
    case 'year':
      msAgo = 365 * 24 * 60 * 60 * 1000;
      break;
    default:
      return data;
  }
  const cutoff = now.getTime() - msAgo;
  const filteredData = data.filter(item => new Date(item.timestamp).getTime() > cutoff);
  filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return filteredData;
}
