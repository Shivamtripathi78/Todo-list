import json
from pathlib import Path

FILE = Path(__file__).with_name("tasks.json")


def load_tasks():
    if FILE.exists():
        try:
            with open(FILE, "r", encoding="utf-8") as file:
                data = json.load(file)
                if isinstance(data, list):
                    return data
        except (json.JSONDecodeError, OSError):
            print("Could not load saved tasks. Starting with an empty list.")

    return []


def save_tasks(tasks):
    with open(FILE, "w", encoding="utf-8") as file:
        json.dump(tasks, file, indent=4)


def view_tasks(tasks):
    if not tasks:
        print("\nNo tasks available!")
        return

    print("\n===== YOUR TASKS =====")

    for index, task in enumerate(tasks, start=1):
        status = "Completed" if task["completed"] else "Pending"
        print(f"{index}. {task['title']} [{status}]")


def add_task(tasks):
    title = input("\nEnter task: ").strip()

    if not title:
        print("Task cannot be empty!")
        return

    tasks.append({
        "title": title,
        "completed": False
    })

    save_tasks(tasks)
    print("Task added successfully!")


def get_task_index(tasks):
    view_tasks(tasks)

    if not tasks:
        return None

    try:
        number = int(input("\nEnter task number: "))

        if 1 <= number <= len(tasks):
            return number - 1

        print("Invalid task number!")

    except ValueError:
        print("Please enter a valid number!")

    return None


def complete_task(tasks):
    index = get_task_index(tasks)

    if index is not None:
        tasks[index]["completed"] = True
        save_tasks(tasks)
        print("Task marked as completed!")


def edit_task(tasks):
    index = get_task_index(tasks)

    if index is not None:
        new_title = input("Enter new task title: ").strip()

        if not new_title:
            print("Task title cannot be empty!")
            return

        tasks[index]["title"] = new_title
        save_tasks(tasks)
        print("Task updated successfully!")


def delete_task(tasks):
    index = get_task_index(tasks)

    if index is not None:
        removed = tasks.pop(index)
        save_tasks(tasks)
        print(f"Deleted: {removed['title']}")


def main():
    tasks = load_tasks()

    while True:
        print("\n===== TO-DO LIST MANAGER =====")
        print("1. Add Task")
        print("2. View Tasks")
        print("3. Complete Task")
        print("4. Edit Task")
        print("5. Delete Task")
        print("6. Exit")

        choice = input("\nEnter your choice (1-6): ").strip()

        if choice == "1":
            add_task(tasks)

        elif choice == "2":
            view_tasks(tasks)

        elif choice == "3":
            complete_task(tasks)

        elif choice == "4":
            edit_task(tasks)

        elif choice == "5":
            delete_task(tasks)

        elif choice == "6":
            print("Goodbye!")
            break

        else:
            print("Invalid choice! Try again.")


if __name__ == "__main__":
    main()