import { useCallback, useEffect, useState } from "react";

import {
  listBankTree,
  type BankNode,
  type BankTreeScope,
} from "@/api/bankNodes";
import { resolveApiErrorMessage } from "@/lib/apiErrors";

import { buildBankTree, type TreeBankNode } from "./buildBankTree";

type UseBankTreeOptions = {
  scope?: BankTreeScope;
  enabled?: boolean;
};

type UseBankTreeState = {
  flatNodes: BankNode[];
  tree: TreeBankNode[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useBankTree({
  scope = "mine",
  enabled = true,
}: UseBankTreeOptions = {}): UseBankTreeState {
  const [flatNodes, setFlatNodes] = useState<BankNode[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadTree() {
      setLoading(true);
      setError(null);

      try {
        const nodes = await listBankTree({ scope });
        if (!ignore) {
          setFlatNodes(nodes ?? []);
        }
      } catch (loadError) {
        if (!ignore) {
          setFlatNodes([]);
          setError(
            resolveApiErrorMessage(loadError, "题库树加载失败，请稍后再试。"),
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadTree();

    return () => {
      ignore = true;
    };
  }, [enabled, reloadKey, scope]);

  return {
    error,
    flatNodes,
    loading,
    refresh,
    tree: buildBankTree(flatNodes),
  };
}
