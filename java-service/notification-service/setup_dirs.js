const fs = require('fs');
const path = require('path');
const basePath = 'C:\\Users\\hieut\\Desktop\\smart-collab\\java-service\\notification-service';

// Create directories
const javaDir = path.join(basePath, 'src', 'main', 'java', 'com', 'smartcollab', 'notification');
const resourcesDir = path.join(basePath, 'src', 'main', 'resources');

// Create directory structure
fs.mkdirSync(javaDir, { recursive: true });
fs.mkdirSync(resourcesDir, { recursive: true });

console.log('✓ Created directory structure');

// Move Java file
const srcJava = path.join(basePath, 'NotificationServiceApplication.java');
const dstJava = path.join(javaDir, 'NotificationServiceApplication.java');

if (fs.existsSync(srcJava)) {
    fs.renameSync(srcJava, dstJava);
    console.log('✓ Moved NotificationServiceApplication.java');
}

// Move YAML file
const srcYaml = path.join(basePath, 'application.yml');
const dstYaml = path.join(resourcesDir, 'application.yml');

if (fs.existsSync(srcYaml)) {
    fs.renameSync(srcYaml, dstYaml);
    console.log('✓ Moved application.yml');
}

console.log('\nSetup complete! Directory structure:');
console.log('src/main/java/com/smartcollab/notification/NotificationServiceApplication.java');
console.log('src/main/resources/application.yml');
