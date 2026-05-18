

async function test() {
  const API_KEY = "724773c6395e755e4f933727a74b0cdb20e4243516e9289fc3ad0debcf701973";
  const API_URL = 'http://apis.data.go.kr/1613000/TrainInfoService/getCtyCodeList';

  const queryParams = new URLSearchParams({
    _type: 'json',
  });

  const url = `${API_URL}?serviceKey=${API_KEY}&${queryParams.toString()}`;
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
