<!-- BEGIN:crud-entity-architecture -->
# Single-Page CRUD Entity Architecture

When creating or refactoring a single-page CRUD entity (e.g. Categories, Wallets, etc.), follow this exact client-server orchestration and multi-file component structure:

1. **Server Page Entrypoint (`page.tsx`)**:
   - Keep as a Server Component.
   - Defines the `metadata` and fetches initial data from the database/API.
   - Passes the data and metadata as props down to the client page container component.

2. **Client Page Container Component (`<entity>-client.tsx`)**:
   - Must be a client component (`'use client'`).
   - Manages all active UI states for entity CRUD operations:
     - `formOpen` / `drawerOpen` (boolean)
     - `selectedEntity` (entity type | undefined)
     - `deleteOpen` (boolean)
     - `isDeleting` (boolean)
   - Renders `<PageLayout>` and places the "Add Entity" button in the `actions` prop of `<PageLayout>`.
   - Orchestrates the three subcomponents (List, Form/Drawer, Delete AlertDialog) and passes relevant states/callbacks down to them.

3. **Subcomponent Separation (each in its own file)**:
   - **List Component (`<entity>-list.tsx`)**:
     - Pure presentation component receiving the entity list and event handlers: `onEdit(entity)` and `onDelete(entity)`.
     - Displays the rows. It must not contain or trigger modal/dialog/drawer wrappers or state directly inside the row mappings to keep a low DOM node count and avoid redundant mounts.
   - **Form/Drawer Component (`<entity>-form.tsx`)**:
     - Direct wrapper around `ResponsiveDrawer` or `Dialog` containing the form.
     - Accepts control props (`open`, `onOpenChange`, and optional `initialData`).
     - Must always use `@tanstack/react-form` and a `zod` schema for forms and validations. Handles loading states.
     - Resets form values in a `useEffect` when the `open` prop becomes true.
   - **Delete Component (`<entity>-delete-dialog.tsx`)**:
     - Isolated component wrapping the `AlertDialog` confirm dialog.
     - Accepts control props (`open`, `onOpenChange`, `isDeleting`, `onConfirm`).
<!-- END:crud-entity-architecture -->

<!-- BEGIN:base-ui-polymorphic-render -->
# Base UI Polymorphic Rendering

When rendering a component as a different HTML element or custom React component (such as rendering a trigger as a custom element), do NOT use the Radix-style `asChild` prop. The project uses `@base-ui/react` components, which do not support `asChild`. Instead, use the `render` prop.

This applies to components like:
- `DrawerClose` (e.g. `render={<Button variant="outline">Cancel</Button>}`)
- `DialogTrigger` (e.g. `render={<Button>Open</Button>}`)
- `DialogClose`
- `DropdownMenuTrigger`

### Rule for Link/Anchor Components
Do NOT use `<Button render={<a />} nativeButton={false} />` or wrap `<Button>` inside a `<Link>` or `<a>` tag (which leads to invalid HTML markup of buttons nested in anchors).
Instead, use the `buttonVariants` helper from `@/components/ui/button` directly on the link component (`Link` or `<a>`) to style it as a button.

### Examples:

#### 1. Polymorphic Rendering with Triggers/Close buttons
- **Incorrect:**
  ```tsx
  <DrawerClose asChild>
    <Button variant="outline">Cancel</Button>
  </DrawerClose>
  ```
- **Correct:**
  ```tsx
  <DrawerClose render={<Button variant="outline">Cancel</Button>} />
  ```

#### 2. Link styled as a Button (Routing)
- **Incorrect:**
  ```tsx
  <Button render={<Link href="/settings/parsers/new" />}>
    Create Custom Parser
  </Button>
  
  // Or wrapping Button in Link:
  <Link href="/settings/parsers/new">
    <Button>Create Custom Parser</Button>
  </Link>
  ```
- **Correct:**
  ```tsx
  import { buttonVariants } from '@/components/ui/button';
  
  <Link
    href="/settings/parsers/new"
    className={buttonVariants({ variant: 'default' })}>
    Create Custom Parser
  </Link>
  ```
<!-- END:base-ui-polymorphic-render -->
