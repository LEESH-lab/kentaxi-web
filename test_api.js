

async function test() {
  const API_KEY = "$2a$10$Uj0Hpcq6JBYNVqPNwrPi3OSrLSiJefHzOttPtNNJBwZWY2gKql/qS";
  const API_URL = 'https://openapi.kric.go.kr/openapi/trainUseInfo/subwayTimetable';

  const queryParams = new URLSearchParams({
    format: 'json',
    railOprIsttCd: 'KR',
    dayCd: '8',
    lnCd: '1',
    stinCd: '1001'
  });

  const url = `${API_URL}?serviceKey=${encodeURIComponent(API_KEY)}&${queryParams.toString()}`;
  console.log("URL:", url);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response Text:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
