export interface Train {
  type: 'SRT' | 'KTX' | string;
  number: string;
  departureTime: string; // ISO string for full date-time
  arrivalTime?: string;
  from: string;
  to: string;
}

export const trainService = {
  getTrainsByDirection: async (direction: 'TO_STATION' | 'FROM_STATION', date?: string): Promise<Train[]> => {
    try {
      const url = `/api/trains?direction=${direction}${date ? `&date=${date}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      return await res.json();
    } catch (error) {
      console.error('Failed to fetch trains:', error);
      return [];
    }
  }
};
