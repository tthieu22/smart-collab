# Notification Service Setup Guide

## Current Status
The following files have been created in the notification-service root directory:
- ✅ `NotificationServiceApplication.java` (needs to be moved to src/main/java/com/smartcollab/notification/)
- ✅ `application.yml` (needs to be moved to src/main/resources/)
- ✅ `pom.xml` (already in correct location)
- ✅ `.env` (already in correct location)
- ✅ `setup_dirs.py` (helper script for setup)

## Required Actions

### Step 1: Create Directory Structure
Run this command in Windows Command Prompt:
```batch
cd C:\Users\hieut\Desktop\smart-collab\java-service\notification-service
mkdir src\main\java\com\smartcollab\notification
mkdir src\main\resources
```

### Step 2: Move Files to Correct Locations
Option A - Using Python:
```batch
python setup_dirs.py
```

Option B - Using Windows Commands:
```batch
move NotificationServiceApplication.java src\main\java\com\smartcollab\notification\
move application.yml src\main\resources\
```

### Step 3: Verify Structure
```batch
tree /F src
```

Should show:
```
src
├── main
│   ├── java
│   │   └── com
│   │       └── smartcollab
│   │           └── notification
│   │               └── NotificationServiceApplication.java
│   └── resources
│       └── application.yml
└── test
```

## File Contents Created

### 1. NotificationServiceApplication.java
- Spring Boot main application class
- Located at: src/main/java/com/smartcollab/notification/

### 2. application.yml
- Spring Boot configuration file
- MongoDB, RabbitMQ, Redis, and SMTP configuration
- Located at: src/main/resources/

### 3. pom.xml
- Maven project configuration
- Dependencies: Spring Web, AMQP, Redis, Mail, MongoDB, Swagger, Actuator
- Already in correct root location

### 4. .env
- Environment variables for development
- MongoDB URI, RabbitMQ, Redis, SMTP credentials
- Already in correct root location

## Next Steps

1. Run the directory creation command above
2. Move the files to their correct locations
3. Clean up temporary files (create_dirs.bat, setup_dirs.py)
4. Run Maven build: `mvn clean install`
5. Start the service: `mvn spring-boot:run`

## Troubleshooting

If you encounter issues, ensure:
- Java 21 is installed
- Maven is installed and configured
- All dependencies can be downloaded (check internet connection)
- .env file has valid credentials
