import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  listMyBankTree,
  listPublicBankTree,
  type BankNode,
  type BankTreeScope,
} from "@/api/bankNodes";
import { resolveApiErrorMessage } from "@/lib/apiErrors";

import { buildBankTree, type TreeBankNode } from "./buildBankTree";

type UseBankTreeOptions = {
  scope?: BankTreeScope;
  rootId?: number;
  enabled?: boolean;
};

type UseBankTreeState = {
  flatNodes: BankNode[];
  tree: TreeBankNode[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

/**
 * 题库树短时缓存（模块级，跨组件挂载存活）：
 * Tab 往返、子树前进后退时立即复用上次结果，不再回退骨架屏；
 * 超过 TTL 的数据后台静默刷新。骨架屏仅用于无缓存可展示的首次加载。
 */
const BANK_TREE_CACHE_TTL = 60_000;
const BANK_TREE_CACHE_LIMIT = 50;

const bankTreeCache = new Map<string, { data: BankNode[]; fetchedAt: number }>();

function cacheKey(scope: BankTreeScope, rootId?: number) {
  return `${scope}:${rootId ?? ""}`;
}

function readCache(key: string) {
  return bankTreeCache.get(key);
}

function writeCache(key: string, data: BankNode[]) {
  bankTreeCache.delete(key);
  bankTreeCache.set(key, { data, fetchedAt: Date.now() });

  if (bankTreeCache.size > BANK_TREE_CACHE_LIMIT) {
    const oldest = bankTreeCache.keys().next().value;
    if (oldest !== undefined) {
      bankTreeCache.delete(oldest);
    }
  }
}

export function useBankTree({
  scope = "mine",
  rootId,
  enabled = true,
}: UseBankTreeOptions = {}): UseBankTreeState {
  const key = cacheKey(scope, rootId);
  const [flatNodes, setFlatNodes] = useState<BankNode[]>(
    () => readCache(key)?.data ?? [],
  );
  const [loading, setLoading] = useState(() => enabled && !readCache(key));
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const forceReloadRef = useRef(false);

  const refresh = useCallback(() => {
    forceReloadRef.current = true;
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let ignore = false;
    // 手动 refresh（重试、增删改后）强制走网络并展示加载态，其余情况优先用缓存。
    const forceReload = forceReloadRef.current;
    forceReloadRef.current = false;
    const cached = readCache(key);

    async function loadTree(options?: { silent?: boolean }) {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const nodes =
          scope === "public"
            ? await listPublicBankTree({ rootId })
            : await listMyBankTree({ rootId });
        if (!ignore) {
          writeCache(key, nodes ?? []);
          setFlatNodes(nodes ?? []);
          setLoading(false);
        }
      } catch (loadError) {
        if (!ignore && !options?.silent) {
          setFlatNodes([]);
          setError(
            resolveApiErrorMessage(loadError, "题库树加载失败，请稍后再试。"),
          );
          setLoading(false);
        }
      }
    }

    if (cached && !forceReload) {
      setFlatNodes(cached.data);
      setLoading(false);
      setError(null);

      if (Date.now() - cached.fetchedAt > BANK_TREE_CACHE_TTL) {
        void loadTree({ silent: true });
      }
    } else {
      void loadTree();
    }

    return () => {
      ignore = true;
    };
  }, [enabled, key, reloadKey, rootId, scope]);

  return {
    error,
    flatNodes,
    loading,
    refresh,
    tree: useMemo(() => buildBankTree(flatNodes), [flatNodes]),
  };
}
