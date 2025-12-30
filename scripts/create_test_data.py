"""
Script to create test data for development/testing.
Run: python manage.py shell < create_test_data.py
"""

from django.contrib.auth import get_user_model
from apps.tasks.models import List, Tag, Task, Habit, HabitLog
from django.utils import timezone
from datetime import timedelta
from recurrence import Recurrence
from dateutil import rrule

User = get_user_model()

print("Creating test data...")

# Create test user
user, created = User.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@example.com',
        'timezone': 'America/New_York'
    }
)
if created:
    user.set_password('testpass123')
    user.save()
    print(f"✓ Created user: {user.username}")
else:
    print(f"✓ User already exists: {user.username}")

# Create Lists
work_list = List.objects.get_or_create(
    user=user,
    name='Work',
    defaults={'color': '#1E90FF', 'icon': '💼', 'sort_order': 1.0}
)[0]

personal_list = List.objects.get_or_create(
    user=user,
    name='Personal',
    defaults={'color': '#32CD32', 'icon': '🏠', 'sort_order': 2.0}
)[0]

print(f"✓ Created lists: {work_list.name}, {personal_list.name}")

# Create Tags
urgent_tag = Tag.objects.get_or_create(
    user=user,
    name='urgent',
    defaults={'color': '#FF4500'}
)[0]

meeting_tag = Tag.objects.get_or_create(
    user=user,
    name='meeting',
    defaults={'color': '#9370DB'}
)[0]

print(f"✓ Created tags: {urgent_tag.name}, {meeting_tag.name}")

# Create Tasks with hierarchy
if Task.objects.filter(user=user).count() == 0:
    # Create root task
    project = Task.add_root(
        user=user,
        title='Q4 Product Launch',
        list=work_list,
        priority=Task.PRIORITY_HIGH,
        status=Task.STATUS_IN_PROGRESS,
        kanban_order=1.0
    )
    project.tags.add(urgent_tag)
    
    # Create subtasks
    design = project.add_child(
        user=user,
        title='Design mockups',
        list=work_list,
        priority=Task.PRIORITY_MEDIUM,
        status=Task.STATUS_COMPLETED,
        kanban_order=1.0
    )
    
    dev = project.add_child(
        user=user,
        title='Development',
        list=work_list,
        priority=Task.PRIORITY_HIGH,
        status=Task.STATUS_IN_PROGRESS,
        kanban_order=2.0
    )
    
    # Create sub-subtask
    dev.add_child(
        user=user,
        title='Backend API',
        list=work_list,
        priority=Task.PRIORITY_HIGH,
        status=Task.STATUS_COMPLETED,
        kanban_order=1.0
    )
    
    dev.add_child(
        user=user,
        title='Frontend UI',
        list=work_list,
        priority=Task.PRIORITY_HIGH,
        status=Task.STATUS_IN_PROGRESS,
        kanban_order=2.0
    )
    
    # Create recurring task (every Monday)
    recurring_task = Task.add_root(
        user=user,
        title='Weekly Team Meeting',
        notes='Discuss project progress and blockers',
        list=work_list,
        priority=Task.PRIORITY_MEDIUM,
        due_date=timezone.now() + timedelta(days=1),
        kanban_order=2.0
    )
    recurring_task.tags.add(meeting_tag)
    
    # Set recurrence: Every Monday at 10 AM
    recurring_task.recurrence = Recurrence(
        rrules=[rrule.rrule(rrule.WEEKLY, byweekday=rrule.MO)]
    )
    recurring_task.save()
    
    # Create personal task
    Task.add_root(
        user=user,
        title='Buy groceries',
        list=personal_list,
        priority=Task.PRIORITY_LOW,
        due_date=timezone.now() + timedelta(days=2),
        kanban_order=1.0
    )
    
    print("✓ Created task hierarchy with recurring tasks")
else:
    print("✓ Tasks already exist")

# Create Habits
if Habit.objects.filter(user=user).count() == 0:
    exercise = Habit.objects.create(
        user=user,
        name='Morning Exercise',
        description='30 minutes of cardio',
        color='#FF6347',
        icon='🏃',
        frequency=Habit.FREQUENCY_DAILY,
        sort_order=1.0
    )
    
    reading = Habit.objects.create(
        user=user,
        name='Read',
        description='Read for 20 minutes',
        color='#4169E1',
        icon='📚',
        frequency=Habit.FREQUENCY_DAILY,
        sort_order=2.0
    )
    
    # Create some habit logs
    today = timezone.now().date()
    for i in range(7):
        log_date = today - timedelta(days=i)
        HabitLog.objects.create(
            habit=exercise,
            date=log_date,
            completed=(i % 2 == 0)  # Every other day
        )
        HabitLog.objects.create(
            habit=reading,
            date=log_date,
            completed=(i < 5)  # Last 5 days
        )
    
    print("✓ Created habits with logs")
else:
    print("✓ Habits already exist")

print("\n" + "="*50)
print("Test data created successfully!")
print("="*50)
print(f"\nTest User Credentials:")
print(f"  Username: testuser")
print(f"  Password: testpass123")
print(f"\nYou can now:")
print(f"  1. Login via API: POST /api/auth/login/")
print(f"  2. Access admin: http://localhost:8000/admin/")
print(f"  3. View API docs: http://localhost:8000/api/docs/")
