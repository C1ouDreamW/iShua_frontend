import { Check, ChevronDown, Minus } from "lucide-react";

import { hasMinRole, ROLE_LABEL } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

const ROLES: UserRole[] = ["USER", "PREMIUM", "ADMIN"];

const FEATURE_MATRIX: { label: string; minRole: UserRole }[] = [
  { label: "公开题库、错题与记录", minRole: "USER" },
  { label: "私有题库、管理与 AI 导入", minRole: "PREMIUM" },
  { label: "用户与权限管理", minRole: "ADMIN" },
];

const ROLE_SUMMARIES: { role: UserRole; description: string }[] = [
  {
    role: "USER",
    description: "使用公开题库，并同步错题与练习记录。",
  },
  {
    role: "PREMIUM",
    description: "另可使用私有题库、题库管理与 AI 智能导入。",
  },
  {
    role: "ADMIN",
    description: "另可管理用户与账号权限。",
  },
];

type RoleFeatureCompareProps = {
  className?: string;
  highlightRole?: UserRole;
  /** 深色品牌底（登录/注册左栏） */
  tone?: "default" | "onBrand";
};

export function RoleFeatureCompare({
  className,
  highlightRole = "USER",
  tone = "default",
}: RoleFeatureCompareProps) {
  const onBrand = tone === "onBrand";

  return (
    <section
      aria-label="各权限可用功能对比"
      className={cn("min-w-0", className)}
    >
      <p
        className={cn(
          "text-xs font-medium tracking-wide",
          onBrand ? "text-white/70" : "text-text-secondary",
        )}
      >
        权限与功能
      </p>

      <details
        className={cn(
          "group mt-3 rounded-md border md:hidden",
          onBrand ? "border-white/20" : "border-brand/20",
        )}
      >
        <summary
          className={cn(
            "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden",
            onBrand ? "text-white" : "text-text-primary",
          )}
        >
          查看账号权限说明
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform group-open:rotate-180"
          />
        </summary>
        <div
          className={cn(
            "border-t px-4 py-1",
            onBrand ? "border-white/15" : "border-brand/15",
          )}
        >
          {ROLE_SUMMARIES.map(({ role, description }) => (
            <div
              className={cn(
                "py-3",
                onBrand
                  ? "border-b border-white/10 last:border-0"
                  : "border-b border-brand/10 last:border-0",
              )}
              key={role}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{ROLE_LABEL[role]}</p>
                {role === highlightRole ? (
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      onBrand ? "text-white/65" : "text-brand/70",
                    )}
                  >
                    注册即得
                  </span>
                ) : null}
              </div>
              <p
                className={cn(
                  "mt-1 text-xs leading-5",
                  onBrand ? "text-white/70" : "text-text-secondary",
                )}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </details>

      <div className="mt-3 hidden md:block">
        <table className="w-full min-w-0 border-collapse text-left text-xs">
          <thead>
            <tr
              className={cn(
                "border-b",
                onBrand ? "border-white/15" : "border-brand/15",
              )}
            >
              <th
                className={cn(
                  "pb-3 pr-2 font-normal",
                  onBrand ? "text-white/55" : "text-text-muted",
                )}
              >
                功能
              </th>
              {ROLES.map((role) => {
                const highlighted = role === highlightRole;

                return (
                  <th
                    className={cn(
                      "px-1 pb-3 text-center",
                      highlighted &&
                        (onBrand
                          ? "border-x border-white/20"
                          : "border-x border-brand/20"),
                    )}
                    key={role}
                    scope="col"
                  >
                    <span
                      className={cn(
                        "inline-flex flex-col items-center leading-tight",
                        highlighted
                          ? onBrand
                            ? "text-white"
                            : "text-brand"
                          : onBrand
                            ? "text-white/75"
                            : "text-text-secondary",
                      )}
                    >
                      <span className="font-medium">
                        {ROLE_LABEL[role]}
                      </span>
                      {highlighted ? (
                        <span
                          className={cn(
                            "mt-1 text-[9px] font-normal",
                            onBrand ? "text-white/65" : "text-brand/70",
                          )}
                        >
                          注册即得
                        </span>
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {FEATURE_MATRIX.map((feature) => (
              <tr
                className={cn(
                  "border-b last:border-0",
                  onBrand ? "border-white/10" : "border-brand/10",
                )}
                key={feature.label}
              >
                <th
                  className={cn(
                    "py-2.5 pr-2 font-normal leading-5",
                    onBrand ? "text-white/90" : "text-text-primary",
                  )}
                  scope="row"
                >
                  {feature.label}
                </th>
                {ROLES.map((role) => {
                  const enabled = hasMinRole(role, feature.minRole);
                  const highlighted = role === highlightRole;

                  return (
                    <td
                      className={cn(
                        "px-1 py-2.5 text-center",
                        highlighted &&
                          (onBrand
                            ? "border-x border-white/20"
                            : "border-x border-brand/20"),
                      )}
                      key={role}
                    >
                      {enabled ? (
                        <Check
                          aria-hidden="true"
                          className={cn(
                            "mx-auto size-3.5",
                            onBrand
                              ? highlighted
                                ? "text-white"
                                : "text-white/80"
                              : highlighted
                                ? "text-brand"
                                : "text-brand/65",
                          )}
                        />
                      ) : (
                        <Minus
                          aria-hidden="true"
                          className={cn(
                            "mx-auto size-3",
                            onBrand ? "text-white/25" : "text-text-muted/35",
                          )}
                        />
                      )}
                      <span className="sr-only">
                        {enabled ? "可用" : "不可用"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        className={cn(
          "mt-3 hidden text-[11px] leading-5 md:block",
          onBrand ? "text-white/60" : "text-text-secondary",
        )}
      >
        高级用户包含普通用户全部功能，需联系管理员开通。
      </p>
    </section>
  );
}
