# Strictly adhere to the instructions in the following section element:

<section>

## General Principles

1. Don’t assume. Don’t hide confusion. Surface tradeoffs.
2. Minimum code that solves the problem. Nothing speculative.
3. Touch only what you must. Clean up only your own mess.
4. Create tests to confirm completion success. Iterate on tasks and do not mark them complete until verification that tests succeed.
5. Maintain State Hygiene. Never complete a turn without verifying the state of your context management files (especially for underway and completed tasks).

## Context Management

To maintain progress across sessions, reference and update the following files in the current project docs/context folder during every user interaction, even if you also edit other similarly-purposed artifacts due to other instructions:

1. Project Goals (PROJECT_GOALS.md)
    - Purpose: Defines functional and business objectives.
   - Handling: Read this when starting work to understand overall desired outcomes and constraints.

2. Project Plan (PROJECT_PLAN.md)
    - Purpose: High-level feature roadmap and technical architecture to achieve the project goals.
    - Handling: Verify plan is sufficient to achieve project goals. Verify Task Management produces work aligned with this plan. Suggest changes to this plan when necessary, but do not change this plan without getting explicit approval.

3. Task Management
    1. Tasks Planned (TASKS_PLANNED.md)
        - Purpose: A granular checklist of what is next towards achieving project goals.
        - Handling: Record in this file the tasks for getting from this project's current state to the identified goal. Ensure tasks are understandable, coherent, and aligned with PROJECT_PLAN.md.

    2. Tasks Underway (TASKS_UNDERWAY.md)
        - Purpose: A granular checklist of work started but not finished.
        - Handling: Before starting any work, the applicable task(s) should first be recorded in this file and removed completely from the TASKS_PLANNED.md file. Supplement the task summary with specific steps or other details planned for implementation - especially non-obvious logic. Mark progress of specific steps/details of tasks as work is performed. Work that requires additional validation remains in this file until confirmed as complete.

    3. Tasks Completed (TASKS_COMPLETED.md)
        - Purpose: A list of what has been completed during work towards project goals.
        - Handling: Once any task is complete with no more validation required, move that task from the TASKS_UNDERWAY.md file to the end of this file, summarizing how the task was implemented (especially any non-obvious logic), any root cause explanation for bugs being fixed, and any tests modified that specifically validate changes.
        - Mandatory Archival Protocol: Immediately after adding a new task to this file, you MUST check its line count. If the file exceeds 100 lines, you must execute the following compression sequence:
            1. Create a new archive file named TASKS_COMPLETED_<YYYY-MM-DD_HHMM>.md
          2. Move the oldest 50% of the tasks (including references to previously archived tasks) from TASKS_COMPLETED.md into the new archive file
          3. Replace the moved tasks at the top of TASKS_COMPLETED.md with an up to 500-word summary of what all archived tasks accomplished and a link to the newly created archive file. Do not modify the unarchived tasks.

## Work Planning

- Modular Updates: Perform Context Management immediately before and after performing work.
- Post-Task Verification: You must explicitly confirm in your final response that you have run validation tests and properly handled TASKS_COMPLETED.md, including having performed the Archival Protocol if required.
- Dependency Awareness: Before suggesting a new library or Gradle change, check existing libraries to avoid redundant or conflicting dependencies.
- Learn from Experience: When planning work, review the TASKS_COMPLETED files to determine if the issue or other related issues have previous work performed.

## Software Rules

### Testing

- Write unit tests for every new utility function.
- Write integration tests for every API endpoint.
- Minimum 80% coverage on new code.
- Create tests for each resolved issue.

### Design Patterns

- Split files longer than 300 lines into modules.
- Include declaration-level comments right above a class, method, or function appropriate for documentation and inline comments to explain complex code choices or algorithmic steps to other developers reading the code.
- Use a logger instead of printing to console (standard data streams).
- Use a common envelope for all API responses.
- Use the Repository pattern for all database access.
- Manage schemas and version migrations programmatically

</section>
