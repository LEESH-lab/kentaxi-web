/**
 * Formats a KENTECH school email into a beautiful official name.
 * e.g., test_kentaxi@kentech.ac.kr -> KENTAXI 테스트 계정
 *       jisoo_kim@kentech.ac.kr -> Jisoo Kim
 */
export function formatKentechName(email: string | null | undefined): string {
  if (!email) return "KENTECH 사용자";
  const localPart = email.split('@')[0];
  
  // Special mappings for test/demo accounts
  if (localPart === 'test_kentaxi') return "KENTAXI 테스트 계정";
  if (localPart === 'jisoo') return "지수";
  
  // General parsing: split by underscore, hyphen, or dot
  const parts = localPart.split(/[_.-]/);
  const cleanName = parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
  
  return cleanName;
}
