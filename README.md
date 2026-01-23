# Cerus

How to set it up. 
1. install uv, https://docs.astral.sh/uv/
2. cd into backend, run uv init, and uv sync
3. in the backend folder, make a .env file and add

"
DATABASE_URL=sqlite:///./databse.db

API_PREFIX=/api
DEBUG=True

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
"

5. then run uv run main.py
, keep in mind that the db will be empty because it creates a new table.
6. ON a seperate terminal, cd into frontend
7. npm install, npm run dev
it should work.
8. if something is broken, make sure react app is on localhost port 5173 and the fast api is 8000


**One-liner:** Track your screws, modules, projects, and prototyping mistakes while documenting your entire hardware build journey.

---

## What It Does

Cerus helps you manage hardware projects from inventory to documentation by tracking parts, project requirements, prototype issues, and lessons learned all in one place.

## Why Use It

Stop juggling multiple tools to manage your builds. Know exactly what parts you have, what each project needs, what's broken, and document your entire process for yourself and others.

---

## Feature Roadmap

### Phase 1: Screw Tracker
Track all your screws by type, size, and quantity.
- Log M3, M4, M5 screws and other fasteners
- Track quantities and storage locations
- Set low-stock alerts

### Phase 2: Module Tracker
Expand inventory to standard components.
- Track bearings, motors, sensors, electronics
- Organize by category and specifications
- Link to datasheets and supplier info

### Phase 3: Project Tracker
Connect projects to your inventory.
- Create projects and assign parts from inventory
- See how many screws/modules each project needs
- Auto-update inventory when parts are allocated
- Track project status and completion

### Phase 4: Custom Parts Inventory
Draw and catalog your custom-made parts.
- Sketch parts on a simple canvas
- Add labels and dimensions
- Track quantities of custom fabricated pieces
- Reference these in your projects

### Phase 5: Fix Tracker
Log prototype issues and needed improvements.
- Document what broke or didn't work
- Track fixes needed before next iteration
- Mark issues as resolved
- Link fixes to specific project versions

### Phase 6: Public Journey Links
Share your build process with others.
- Generate shareable links to your project
- Show others your complete build journey
- Control what information is public
- Great for portfolio or community sharing

### Phase 7: Documentation System
Capture and organize what you learned.
- Write notes about techniques and discoveries
- Document design decisions and why you made them
- Create a knowledge base for future projects
- Export documentation for reference

---

## Who It's For

Makers and engineers who prototype hardware and want to track everything from parts to problems to lessons learned in one organized system.

---

## Getting Started

```bash
# Installation instructions coming soon
```

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting pull requests.
