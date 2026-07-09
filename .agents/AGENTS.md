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

<!-- BEGIN:base-ui-select-items -->
# Base UI Select Component

When using the `Select` component (which wraps `@base-ui/react`'s `SelectPrimitive.Root`), you must follow these rules to ensure the selected label is correctly rendered instead of the raw value:

1. **Use the `items` prop**: Always pass an `items` array of `{ value: any, label: string }` objects to the `<Select>` component. Base UI uses this to automatically render the human-readable label inside `<SelectValue>`.
2. **Handling empty states**: If you need an option representing "None" or "Empty", use `value: null` in the `items` array and `value={null as any}` in the corresponding `<SelectItem>`. Do not use arbitrary string placeholders like `'none'`.

### Example:
```tsx
<Select
  value={selectedValue}
  onValueChange={(val) => setSelectedValue(val || '')}
  items={[
    { value: 'option1', label: 'First Option' },
    { value: null, label: 'No Option Selected' }
  ]}
>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">First Option</SelectItem>
    <SelectItem value={null as any} disabled>No Option Selected</SelectItem>
  </SelectContent>
</Select>
```
<!-- END:base-ui-select-items -->

<!-- BEGIN:button-icon-spacing -->
# Button Icon Spacing

When adding an icon inside a `Button` component alongside text:
1. Do NOT use margin classes (like `mr-*` or `ml-*`) on the icon to separate it from the text. The `Button` component uses CSS Flexbox with an automatic gap.
2. Set the `data-icon` attribute on the icon component to `"inline-start"` or `"inline-end"` to enable visually balanced button padding adjustments.

### Example:
```tsx
<Button onClick={handleAddNew}>
  <Plus className="size-4" data-icon="inline-start" />
  Add Transaction
</Button>
```
<!-- END:button-icon-spacing -->

<!-- BEGIN:tailwind-size-shorthand -->
# Tailwind Size Shorthand

Never use separate width and height classes (e.g., `h-4 w-4` or `w-10 h-10`) when the dimensions are equal. Always use the `size-n` shorthand class instead (e.g., `size-4` or `size-10`).
<!-- END:tailwind-size-shorthand -->

<!-- BEGIN:post-change-validation -->
# Post-Change Validation Workflow

Immediately after modifying code:
1. Run `bun run format` to auto-format the files.
2. Run `bun run lint` to check for style violations or warnings.
<!-- END:post-change-validation -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:package-manager -->
# Package Manager

- Always use `bun` and `bunx` over `npm` and `npx` for installing dependencies, running scripts, and executing packages.
<!-- END:package-manager -->
