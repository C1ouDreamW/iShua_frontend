/** 路由级代码分割加载期间的占位：与 AppShell 鉴权加载态同款纸面骨架。 */
export function RouteFallback() {
  return (
    <div className="min-h-screen px-6 py-10">
      <div className="paper-panel mx-auto h-64 max-w-3xl animate-pulse" />
    </div>
  );
}
