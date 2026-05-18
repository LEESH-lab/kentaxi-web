import { NextResponse } from 'next/server';

const API_KEY = process.env.DATA_GO_KR_API_KEY;
const API_URL = 'http://apis.data.go.kr/1613000/TrainInfoService/getStrtpntAlocFndTrainInfo';

// 역 코드 매핑
const STATIONS = {
  NAJU: 'NAT013841',
  YONGSAN: 'NAT010001',
  SUSEO: 'NAT014445',
  MOKPO: 'NAT013851',
};

async function fetchTrainsForRoute(depId: string, arrId: string, date: string) {
  if (!API_KEY) {
    console.error("DATA_GO_KR_API_KEY is not defined in .env");
    return [];
  }

  // URLSearchParams automatically encodes, but the API key is already encoded or might need exact formatting.
  // data.go.kr sometimes fails with standard URL encoding of the key. Let's just append it.
  const queryParams = new URLSearchParams({
    pageNo: '1',
    numOfRows: '100',
    _type: 'json',
    depPlaceId: depId,
    arrPlaceId: arrId,
    depPlandTime: date,
  });

  const url = `${API_URL}?serviceKey=${API_KEY}&${queryParams.toString()}`;
  
  try {
    const res = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KenTaxi/1.0)'
      }
    }); 
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const data = await res.json();
    const items = data.response?.body?.items?.item || data.body?.items?.item;
    
    if (!items) return [];
    
    // Ensure array even if single item returned
    const itemsArray = Array.isArray(items) ? items : [items];
    
    return itemsArray.map((item: any) => {
      // Parse dates: "20231015143000" -> ISO string
      const depStr = item.depplandtime.toString();
      const arrStr = item.arrplandtime.toString();
      
      const formatTime = (t: string) => {
        return `${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}T${t.slice(8,10)}:${t.slice(10,12)}:00+09:00`;
      };

      return {
        type: item.traingradename.includes('SRT') ? 'SRT' : item.traingradename.includes('KTX') ? 'KTX' : item.traingradename,
        number: item.trainno.toString(),
        departureTime: formatTime(depStr),
        arrivalTime: formatTime(arrStr),
        from: item.depplacename,
        to: item.arrplacename,
      };
    }).filter((t: any) => t.type === 'SRT' || t.type === 'KTX'); // Only KTX and SRT
    
  } catch (error) {
    console.error(`Error fetching trains ${depId} -> ${arrId}:`, error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get('direction');
  const reqDate = searchParams.get('date'); // e.g. YYYYMMDD
  
  // Get today's date in YYYYMMDD format (KST)
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const dateStr = reqDate || kst.toISOString().slice(0, 10).replace(/-/g, '');

  let trains: any[] = [];

  if (direction === 'TO_STATION') {
    // KENTECH -> Naju Station -> Departing from Naju to other places
    const [yongsan, suseo, mokpo] = await Promise.all([
      fetchTrainsForRoute(STATIONS.NAJU, STATIONS.YONGSAN, dateStr),
      fetchTrainsForRoute(STATIONS.NAJU, STATIONS.SUSEO, dateStr),
      fetchTrainsForRoute(STATIONS.NAJU, STATIONS.MOKPO, dateStr),
    ]);
    trains = [...yongsan, ...suseo, ...mokpo];
  } else {
    // Naju Station -> KENTECH -> Arriving at Naju from other places
    // In this case, we need to know when they ARRIVE at Naju, so their meeting time is after arrival.
    // We fetch trains departing from Yongsan/Suseo/Mokpo TO Naju.
    const [yongsan, suseo, mokpo] = await Promise.all([
      fetchTrainsForRoute(STATIONS.YONGSAN, STATIONS.NAJU, dateStr),
      fetchTrainsForRoute(STATIONS.SUSEO, STATIONS.NAJU, dateStr),
      fetchTrainsForRoute(STATIONS.MOKPO, STATIONS.NAJU, dateStr),
    ]);
    trains = [...yongsan, ...suseo, ...mokpo];
    
    // For 'FROM_STATION', the user's "departure time" from the station is actually the train's "arrival time" at Naju.
    // So we'll map the train's arrivalTime at Naju to be the 'departureTime' for the UI sorting purposes.
    trains = trains.map(t => ({
      ...t,
      originalDepartureTime: t.departureTime,
      departureTime: t.arrivalTime, // Swap so UI sorts by when they arrive at Naju
    }));
  }

  // 한국 현재 시간 기준으로 이미 지난 열차 필터링
  const currentTime = Date.now();
  
  let sortedTrains = trains
    .filter(t => new Date(t.departureTime).getTime() > currentTime)
    .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

  // Fallback: If API returns no data (e.g., 403 Forbidden because key is not yet active), use mock data
  if (sortedTrains.length === 0) {
    console.log("No real data fetched, falling back to mock data.");
    const mockBaseTrains = [
      { type: 'SRT', number: '301', time: '08:15', from: STATIONS.NAJU, to: STATIONS.SUSEO },
      { type: 'KTX', number: '402', time: '09:10', from: STATIONS.NAJU, to: STATIONS.YONGSAN },
      { type: 'SRT', number: '315', time: '11:45', from: STATIONS.NAJU, to: STATIONS.SUSEO },
      { type: 'KTX', number: '421', time: '14:30', from: STATIONS.NAJU, to: STATIONS.YONGSAN },
      { type: 'SRT', number: '342', time: '17:50', from: STATIONS.NAJU, to: STATIONS.SUSEO },
      { type: 'KTX', number: '435', time: '20:15', from: STATIONS.NAJU, to: STATIONS.YONGSAN },
    ];

    const fallbackTrains = [];
    const dateString = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
    
    mockBaseTrains.forEach(base => {
      const departureDateTime = new Date(`${dateString}T${base.time}:00+09:00`);
      if (departureDateTime.getTime() > currentTime) {
        fallbackTrains.push({
          type: base.type,
          number: base.number,
          departureTime: departureDateTime.toISOString(),
          from: direction === 'TO_STATION' ? '나주' : (base.to === STATIONS.SUSEO ? '수서' : '용산'),
          to: direction === 'TO_STATION' ? (base.to === STATIONS.SUSEO ? '수서' : '용산') : '나주',
        });
      }
    });
    sortedTrains = fallbackTrains.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
  }

  return NextResponse.json(sortedTrains);
}
