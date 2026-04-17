import os
import shutil

basePath = r'C:\Users\hieut\Desktop\smart-collab\java-service\notification-service'
javaPath = os.path.join(basePath, 'src', 'main', 'java', 'com', 'smartcollab', 'notification')
resourcePath = os.path.join(basePath, 'src', 'main', 'resources')

# Create directories
os.makedirs(javaPath, exist_ok=True)
os.makedirs(resourcePath, exist_ok=True)

# Move Java file
srcJavaFile = os.path.join(basePath, 'NotificationServiceApplication.java')
dstJavaFile = os.path.join(javaPath, 'NotificationServiceApplication.java')
if os.path.exists(srcJavaFile):
    shutil.move(srcJavaFile, dstJavaFile)
    print(f"Moved: {srcJavaFile} -> {dstJavaFile}")

# Move YAML file
srcYamlFile = os.path.join(basePath, 'application.yml')
dstYamlFile = os.path.join(resourcePath, 'application.yml')
if os.path.exists(srcYamlFile):
    shutil.move(srcYamlFile, dstYamlFile)
    print(f"Moved: {srcYamlFile} -> {dstYamlFile}")

print("Directory structure setup complete!")
