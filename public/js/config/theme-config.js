// Status color classes using CSS variables from the theme system.
// Colors are set via ThemeLoaderService from /config/theme in RTDB.
// Fallback values match the defaults in semantic tokens.
export const KANBAN_STATUS_COLORS_CSS = `
.todo { background: var(--status-todo, #94a3b8); color: var(--status-todo-text, #fff); }
.inprogress { background: var(--status-in-progress, #3b82f6); color: var(--status-in-progress-text, #fff); }
.pausado { background: var(--status-in-progress, #3b82f6); color: var(--status-in-progress-text, #fff); }
.tovalidate { background: var(--status-to-validate, #f59e0b); color: var(--status-to-validate-text, #fff); }
.donevalidated { background: var(--status-done, #10b981); color: var(--status-done-text, #fff); }
.blocked { background: var(--status-blocked, #f43f5e); color: var(--status-blocked-text, #fff); }
.reopened { background: var(--status-blocked, #f43f5e); color: var(--status-blocked-text, #fff); }
.high { background: #e11d48; color: #fff; }
.medium { background: #f59e0b; color: #fff; }
.low { background: #22c55e; color: #fff; }
.default { background: #64748b; color: #fff; }
.created { background: #64748b; color: #fff; }
.assigned { background: var(--brand-primary, #6366f1); color: #fff; }
.fixed { background: #10b981; color: #fff; }
.verified { background: #34d399; color: #fff; }
.closed { background: #14532d; color: #fff; }
.applicationblocker { background: #e11d48; color: #fff; }
.departmentblocker { background: #f59e0b; color: #fff; }
.individualblocker { background: #fbbf24; color: #0f172a; }
.userexperienceissue { background: #22c55e; color: #fff; }
.workflowimprovement { background: #06b6d4; color: #fff; }
.workaroundavailableissue { background: #64748b; color: #fff; }
`