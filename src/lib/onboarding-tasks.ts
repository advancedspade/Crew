export type OnboardingTaskStage = 'THREE_WEEKS' | 'ONE_WEEK' | 'STARTED';

export interface OnboardingTaskDef {
  key: string;
  label: string;
  stage: OnboardingTaskStage;
  teams?: string[];
}

export const THREE_WEEK_TASKS: OnboardingTaskDef[] = [];

export const ALL_ONBOARDING_TASKS: OnboardingTaskDef[] = [
  ...THREE_WEEK_TASKS,
];

export function getOnboardingTaskLabel(taskKey: string): string {
  return ALL_ONBOARDING_TASKS.find((t) => t.key === taskKey)?.label || taskKey;
}

export function tasksApplyToTeam(task: OnboardingTaskDef, team: string | null | undefined): boolean {
  if (!task.teams) return true;
  return !!team && task.teams.includes(team);
}
