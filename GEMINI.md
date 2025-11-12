# Project Overview

This is a Django-based accountability application that allows users to create commitments with financial stakes. Users can set goals and pledge a certain amount of money. If they fail to meet their commitment, they lose the money.

The project is divided into a `backend` (Django) and a `frontend` (not yet implemented).

## Backend

The backend is a Django project that provides a RESTful API for the frontend. It uses the following technologies:

*   **Django:** The web framework.
*   **Django REST Framework:** For building the REST API.
*   **Simple JWT:** For token-based authentication.
*   **PostgreSQL:** The database.
*   **Celery:** For running background tasks (e.g., checking for overdue commitments).

### Key Components

*   **`users` app:** Manages user accounts, profiles, and statistics.
*   **`commitments` app:** Manages the commitments, including their lifecycle, evidence, and payments.

## Building and Running

### Prerequisites

*   Python 3.12
*   PostgreSQL
*   Poetry (optional)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/commitment.git
    cd commitment/backend
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure the database:**
    *   Create a PostgreSQL database.
    *   Create a `.env` file in the `backend` directory and add the following variables:
        ```
        DB_ENGINE=django.db.backends.postgresql
        DB_NAME=your_db_name
        DB_USER=your_db_user
        DB_PASSWORD=your_db_password
        DB_HOST=localhost
        DB_PORT=5432
        ```

4.  **Run database migrations:**
    ```bash
    python manage.py migrate
    ```

### Running the Development Server

```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`.

### Running Tests

```bash
python manage.py test
```

## Development Conventions

*   **Coding Style:** The project follows the PEP 8 style guide.
*   **Testing:** Unit tests are located in the `tests.py` file of each app.
*   **Commits:** Commit messages should be clear and concise.
*   **Branching:** Create a new branch for each feature or bug fix.
