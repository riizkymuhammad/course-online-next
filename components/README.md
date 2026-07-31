# Component architecture

UI components follow atomic design while feature behavior stays grouped by domain.

## Layers

- `atoms/`: indivisible visual primitives such as `Button`, `ActionLink`, `Surface`, and labels.
- `molecules/`: small combinations of atoms such as form controls, alerts, info cards, and answer options.
- `organisms/`: feature-sized UI sections such as exam panels, review sidebars, tables, and dashboard charts.
- Domain folders (`auth/`, `course/`, `tryout/`, `header/`): client orchestration and feature-specific composition. These components may hold state, but should compose shared atoms, molecules, and organisms instead of repeating visual primitives.
- `app/`: routing, server-side data loading, authorization, and page composition. Repeated UI must live under `components/`.

## Rules

1. Keep database and authorization logic in Server Components or `lib/`; never place it in visual primitives.
2. Put state only at the smallest interactive feature boundary.
3. Use `Button` for actions and `ActionLink` for navigation styled as an action.
4. Use the shared fields in `molecules/form` instead of declaring local label/input combinations.
5. Use `Surface`, `InlineAlert`, `InfoCard`, and `SectionLabel` for recurring presentation patterns.
6. Add variants to an existing primitive before duplicating its full class list.
7. Keep domain-specific data types next to the domain composition component and pass serializable props across Server/Client boundaries.
