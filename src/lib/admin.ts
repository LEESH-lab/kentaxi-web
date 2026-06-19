// 관리자 권한 판별 유틸
// 관리자 이메일은 환경변수 ADMIN_EMAILS(콤마 구분)로 덮어쓸 수 있고,
// 없으면 아래 기본값을 사용한다.
const DEFAULT_ADMIN_EMAILS = ["happy1031@kentech.ac.kr"];

export const ADMIN_EMAILS: string[] = (
  process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",")
    : DEFAULT_ADMIN_EMAILS
).map((e) => e.trim().toLowerCase()).filter(Boolean);

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
