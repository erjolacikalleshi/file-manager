# File Manager Application

---

## Running the Application
Start the mock backend server:
```bash
json-server src/app/db.json --port 3000
```
---

## Features

### Authentication and Role-Based Access Control (RBAC)
- **Login:** 
  - Three user roles with distinct access permissions:
    - **Admin:** Full access to all actions.
    - **User:** Full access except for delete operations.
    - **Random:** No access to the File Manager page.
- **Register:** 
  - Newly registered users are assigned the `user` role by default.

---

### Folder and File Tree View
- **Tree Structure:**
  - Folders act as parent nodes, containing child folders or files.
  - Files cannot exist independently in the tree; they must belong to a folder.
- **Dynamic Breadcrumbs:**
  - Breadcrumb navigation updates dynamically as the user navigates through the folder structure.
  - Clicking breadcrumb links selects and expands corresponding folders.

---

### Actions on Folders and Files
#### Folder Actions:
- **New Directory:** Create a new folder within the tree.
- **Rename:** Rename a folder.
- **Delete:** Delete a folder.
- **Upload File:** Upload images, PDFs, or text files into a folder.

#### File Actions:
- **Rename:** Rename a file.
- **Delete:** Delete a file.
- **Move To:** Move a file to another folder.
- **Copy To:** Copy a file to another folder while keeping the original.
- **Revert to Previous Version:** Revert a renamed file to any previously saved name until the original name is restored.

---

### Table View
- **Expandable Nodes:** 
  - Only nodes with children are expandable.
  - Clicking a node shows its children (folders and files) in a table.
- **Actions for Folders:**
  - Rename
  - Delete
  - Upload File
  - Add/Remove Tags
- **Actions for Files:**
  - Rename
  - Delete
  - Preview File
  - Add/Remove Tags
  - Compress File: Add the file to a zip archive in the same folder.
  - Uncompress File: Download a zipped file.

#### Context Menu
- Common actions like Rename and Delete are also accessible through context menus.

#### Table Features:
- **Filtering:**
  - Filter by name.
  - Filter by tags.
  - Advanced Filtering: Filter files by type (image or document).
- **Dynamic Search Results:** 
  - Search results update in real-time as the user types.
- **Batch Operations:** 
  - Perform delete operations on multiple folders or files.
- **Sorting:** 
  - Sort files and folders by:
    - Name
    - Size
    - Last modified date.

---

### Responsive Design
- **Collapsible Sidebar:** 
  - The tree view is collapsible on smaller screens and toggles via an icon click.
- **Theme Customization:** 
  - Users can toggle between themes, with their preference saved in local storage.

---

### Offline Mode and Real-Time Updates
- **Offline Mode:**
  - Cache the folder structure and files in `localStorage` for offline access.
  - Sync changes with the mock backend upon reconnection.
- **Real-Time Updates:**
  - Use RxJS to reflect changes made by other users in real-time.
  - Automatically refresh the file/folder structure upon changes.

---

### State Management
- **NgRx Integration:** 
  - Used to store children of selected parent nodes in the tree to reduce API calls. While not strictly necessary, this demonstrates advanced state management.

---

## Additional Information
- **Dynamic Breadcrumbs:** 
  - Navigate easily through the folder hierarchy by clicking on breadcrumb links, which dynamically update.
- **Snack Bars:** 
  - Used for success and error messages during user actions.

