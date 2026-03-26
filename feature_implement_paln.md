# Group Dynamics Feature Implementation Plan

## Objective
Replace the current `group-compare` placeholder in the dashboard with a working Group Dynamics feature that uses real profile data and computes team-level insights.

## Scope
- Implement interactive group member selection from the profile library already loaded in dashboard state.
- Compute and render live group metrics:
  - Team Balance Index
  - Execution Strength
  - Innovation Pivot
  - Social Cohesion
- Provide clear UX states:
  - Empty selection
  - Not enough members selected
  - Valid analysis state
- Keep design aligned with current dashboard visual language and provided mock direction.

## Out of Scope (for this phase)
- No new database tables or migrations.
- No AI-generated group report API in this iteration.
- No PDF export for group analysis in this iteration.

## Technical Plan

### 1) Add analytics utility
Create `lib/group-dynamics.ts` with deterministic scoring helpers.

Planned exports:
- `type GroupDynamicsInput`
- `type GroupDynamicsResult`
- `computeGroupDynamics(members)`

Computation model:
- Use OCEAN percentiles from each selected profile.
- Team Balance Index:
  - Blend of diversity and overall group health
  - Diversity via standard deviation spread across key traits
  - Health via domain means (higher C/A/E and moderate N influence)
- Execution Strength:
  - Primarily driven by C (+), N (-), A (+ small)
- Innovation Pivot:
  - Primarily driven by O (+), E (+), C (moderating)
- Social Cohesion:
  - Primarily driven by A (+), E (+), N (-)
- Normalize all metric outputs to 0–100.
- Map each metric to qualitative label (`Low`, `Moderate`, `High`, `Very High`).

### 2) Dashboard state + interactions
Update `app/dashboard/dashboard-client.tsx`:
- Add `groupSelectedIds: string[]` state.
- Derive `groupMembers` from selected ids and `profiles`.
- Add actions:
  - `toggleGroupMember(id)`
  - `removeGroupMember(id)`
  - `clearGroupSelection()`
- Add guard when deleting profile: remove it from group selection if present.

### 3) Replace placeholder UI
In `activeView === 'group-compare'` section:
- Replace “coming soon” overlay/mocked fixed values.
- Add interactive blocks:
  - Member selector list (chips/buttons using existing profile metadata).
  - Selected members row with initials and overflow count style.
  - Live metrics card with progress bars and labels.
- Add UX state panels:
  - No profiles available in library.
  - Need at least 3 members for analysis.

### 4) Styling alignment
- Reuse existing tokenized colors and utility classes in `app/globals.css` and dashboard file.
- Keep bars and labels visually close to the provided mock.
- Ensure responsiveness on mobile and desktop.

### 5) Validation
- Run `npm run lint`.
- Manual smoke checks:
  - Dashboard renders.
  - Group tab supports selecting/removing members.
  - Metrics update when membership changes.
  - No console/runtime errors.

## Files To Change
- `feature_implement_paln.md` (this plan)
- `lib/group-dynamics.ts` (new)
- `app/dashboard/dashboard-client.tsx` (update)

## Acceptance Criteria
- Group Dynamics tab no longer shows “Coming Soon”.
- User can select at least 3 profiles and see computed group analytics.
- Metrics and bars update deterministically from selected profiles.
- Lint passes.

## Risks and Mitigations
- Risk: Formula feels arbitrary.
  - Mitigation: Keep formulas simple, transparent, and easily tunable in one utility module.
- Risk: Dashboard file is large and regression-prone.
  - Mitigation: Localize edits to `group-compare` block and grouped state/actions.
- Risk: Mixed profile types (50/120/300) differ in granularity.
  - Mitigation: Use domain-level `%` scores only, available for all profile types.

## Implementation Order
1. Create utility module with tests-by-reasoning (edge-safe calculations).
2. Integrate selection state/actions into dashboard.
3. Replace group placeholder with live UI.
4. Verify and refine UX states.
5. Lint and final QA.