// 송금 딥링크 생성 유틸
// - 토스: 은행명을 그대로 받는다 (supertoss://send)
// - 카카오페이/카카오뱅크: 금융결제원 표준 은행 코드가 필요하다

// 은행명(자유 입력) -> 금융결제원 표준 코드 매핑.
// 사용자가 입력한 은행명에 아래 키워드가 포함되어 있으면 해당 코드를 사용한다.
const BANK_CODE_KEYWORDS: { keywords: string[]; code: string }[] = [
  { keywords: ['카카오'], code: '090' }, // 카카오뱅크
  { keywords: ['토스'], code: '092' }, // 토스뱅크
  { keywords: ['케이', 'k뱅크', 'k 뱅크'], code: '089' }, // 케이뱅크
  { keywords: ['국민', 'kb'], code: '004' },
  { keywords: ['신한'], code: '088' },
  { keywords: ['우리'], code: '020' },
  { keywords: ['하나', 'keb'], code: '081' },
  { keywords: ['농협', 'nh'], code: '011' },
  { keywords: ['기업', 'ibk'], code: '003' },
  { keywords: ['산업', 'kdb'], code: '002' },
  { keywords: ['수협'], code: '007' },
  { keywords: ['부산'], code: '032' },
  { keywords: ['대구', 'im', '아이엠'], code: '031' }, // iM뱅크(구 대구은행)
  { keywords: ['경남'], code: '039' },
  { keywords: ['광주'], code: '034' },
  { keywords: ['전북'], code: '037' },
  { keywords: ['제주'], code: '035' },
  { keywords: ['새마을'], code: '045' },
  { keywords: ['신협'], code: '048' },
  { keywords: ['우체국'], code: '071' },
  { keywords: ['sc', '제일'], code: '023' },
  { keywords: ['씨티', 'citi'], code: '027' },
  { keywords: ['저축'], code: '050' },
];

/** 은행명 문자열에서 금융결제원 표준 은행 코드를 추론한다. 매칭 실패 시 null. */
export function resolveBankCode(bankName?: string | null): string | null {
  if (!bankName) return null;
  const normalized = bankName.toLowerCase().replace(/\s|은행|뱅크/g, '');
  for (const { keywords, code } of BANK_CODE_KEYWORDS) {
    if (keywords.some((kw) => normalized.includes(kw.toLowerCase().replace(/\s/g, '')))) {
      return code;
    }
  }
  return null;
}

/** 토스 송금 딥링크 */
export function getTossLink(bank: string, account: string, amount: number): string {
  return `supertoss://send?bank=${encodeURIComponent(bank)}&accountNo=${encodeURIComponent(
    account
  )}&amount=${amount}`;
}

/**
 * 카카오페이 계좌송금 딥링크.
 * 은행 코드를 추론할 수 있으면 코드를 포함해 바로 송금 화면을 띄우고,
 * 추론에 실패하면 코드 없이 보내 카카오페이 앱에서 은행을 직접 고르도록 한다.
 */
export function getKakaoPayLink(bank: string, account: string, amount: number): string {
  const code = resolveBankCode(bank);
  const params = new URLSearchParams();
  if (code) params.set('bank_code', code);
  params.set('bank_account_number', account);
  params.set('amount', String(amount));
  return `kakaotalk://kakaopay/money/to/account?${params.toString()}`;
}
