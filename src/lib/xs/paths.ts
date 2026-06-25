export function xsHomePath(params?: { venue?: string }): string {
  if (!params?.venue) return "/";
  return `/?venue=${encodeURIComponent(params.venue)}`;
}
