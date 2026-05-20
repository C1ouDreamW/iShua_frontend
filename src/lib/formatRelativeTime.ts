export function formatRelativeTime(iso: string | undefined) {
  if (!iso) {
    return "未知时间";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) {
    return "刚刚";
  }

  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} 小时前`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days} 天前`;
  }

  return date.toLocaleDateString("zh-CN");
}
