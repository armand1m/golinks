const MOBILE_USER_AGENT_REGEX =
  /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;

export function isMobileDevice(userAgent: string): boolean {
  return Boolean(userAgent.match(MOBILE_USER_AGENT_REGEX));
}
