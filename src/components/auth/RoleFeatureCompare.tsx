import { Check, Minus } from "lucide-react";

import { hasMinRole, ROLE_LABEL } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

const ROLES: UserRole[] = ["USER", "PREMIUM", "ADMIN"];

const FEATURE_MATRIX: { label: string; minRole: UserRole }[] = [
  { label: "公开题库刷题", minRole: "USER" },
  { label: "错题本与练习记录", minRole: "USER" },
  { label: "私有题库刷题", minRole: "PREMIUM" },
  { label: "题库与试题管理", minRole: "PREMIUM" },
  { label: "AI 智能导入", minRole: "PREMIUM" },
  { label: "用户权限管理", minRole: "ADMIN" },
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

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-left text-xs">
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
                      <span className="font-medium">{role}</span>
                      <span
                        className={cn(
                          "mt-0.5 text-[10px] font-normal",
                          highlighted
                            ? onBrand
                              ? "text-white/80"
                              : "text-brand/80"
                            : onBrand
                              ? "text-white/55"
                              : "text-text-muted",
                        )}
                      >
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
          "mt-3 text-[11px] leading-5",
          onBrand ? "text-white/60" : "text-text-secondary",
        )}
      >
        高级权限包含上一级全部能力；PREMIUM 需联系管理员开通。
      </p>
    </section>
  );
}
